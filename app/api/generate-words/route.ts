import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let theme = "";
  let totalWordCount = 0;

  try {
    const requestBody = await request.json();
    theme = requestBody.theme;
    totalWordCount = requestBody.totalWordCount;

    if (!theme || !totalWordCount) {
      return NextResponse.json(
        { error: "Theme and totalWordCount are required" },
        { status: 400 }
      );
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterApiKey) {
      return NextResponse.json(
        {
          error:
            "Server configuration error: OpenRouter API key is missing. Please set OPENROUTER_API_KEY.",
        },
        { status: 500 }
      );
    }

    const maxApiRetries = 10; // Increased retries to be more aggressive in reaching the target
    const retryDelayMs = 10000; // Increased delay between retries to 10 seconds
    const collectedWords = new Set<string>();
    let currentRetry = 0;
    let apiWarning: string | null = null;

    while (
      collectedWords.size < totalWordCount &&
      currentRetry < maxApiRetries
    ) {
      const wordsToRequest = totalWordCount - collectedWords.size;
      console.log(
        `Server Attempt ${
          currentRetry + 1
        }: Requesting ${wordsToRequest} words for theme "${theme}". Total collected so far: ${
          collectedWords.size
        }`
      );

      const excludedWordsList = Array.from(collectedWords).join(", ");
      const exclusionPrompt =
        collectedWords.size > 0
          ? `\nDo NOT include any of the following words in your response: ${excludedWordsList}.`
          : "";

      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterApiKey}`,
              "HTTP-Referer":
                process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
              "X-Title": "Word Search Puzzle Generator",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini", // You can also use "openai/gpt-4o-mini" or "anthropic/claude-3-haiku" or other models
              messages: [
                {
                  role: "system",
                  content:
                    "You are a word search puzzle generator. Generate simple, family-friendly words that are suitable for all ages. Respond only with a JSON array of words, no other text or formatting.",
                },
                {
                  role: "user",
                  content: `**CRITICAL: Generate EXACTLY ${wordsToRequest} *unique* words.**

                The words should be simple and fun, suitable for all ages, and for a word search puzzle.

                Make sure the words are:
                - Between 3-12 letters long
                - Common and recognizable
                - Appropriate for all ages
                - Not proper nouns (unless they are very well-known)
                - Varied in length for puzzle difficulty

                **Prioritize words related to the theme "${theme}".**

                ${exclusionPrompt}

                Respond only with a JSON array of words like: ["word1", "word2", "word3"]`,
                },
              ],
              temperature: 0.7,
              max_tokens: 4000, // Increased max_tokens significantly
            }),
          }
        );

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(
            `OpenRouter API error on server retry ${currentRetry + 1}: ${
              response.status
            }`,
            errorBody
          );
          apiWarning = `AI API error on retry ${currentRetry + 1}: ${
            response.status
          }. Could not fetch all words.`;
          break; // Break retry loop on API error
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;

        if (!aiResponse) {
          console.warn(
            `No response from AI on server retry ${currentRetry + 1}.`
          );
          apiWarning = `AI did not return a valid response on retry ${
            currentRetry + 1
          }.`;
          currentRetry++;
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          continue; // Continue to next retry
        }

        let newWords: string[];
        try {
          const cleanResponse = aiResponse
            .replace(/```json\n?|\n?```/g, "")
            .trim();
          newWords = JSON.parse(cleanResponse);
        } catch (parseError) {
          const wordMatches = aiResponse.match(/"([^"]+)"/g);
          if (wordMatches) {
            newWords = wordMatches.map((match: string) =>
              match.replace(/"/g, "")
            );
          } else {
            console.warn(
              `Could not parse AI response on server retry ${
                currentRetry + 1
              }:`,
              aiResponse
            );
            apiWarning = `Could not parse AI response on retry ${
              currentRetry + 1
            }.`;
            currentRetry++;
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
            continue; // Continue to next retry
          }
        }

        // Validate and clean new words
        const validNewWords = newWords
          .filter(
            (word: string) =>
              typeof word === "string" && word.length >= 3 && word.length <= 12
          )
          .map((word: string) => word.toLowerCase().trim());

        const wordsAddedThisAttempt = new Set<string>();
        validNewWords.forEach((word) => {
          if (!collectedWords.has(word)) {
            // Ensure uniqueness against ALL collected words
            collectedWords.add(word);
            wordsAddedThisAttempt.add(word);
          }
        });

        console.log(
          `Server Attempt ${currentRetry + 1} received ${
            validNewWords.length
          } words from AI, added ${
            wordsAddedThisAttempt.size
          } unique new words. Total collected: ${collectedWords.size}`
        );

        // If no new unique words were added in this attempt, it might be stuck.
        // This prevents infinite loops if AI keeps repeating or generating invalid words.
        // if (wordsAddedThisAttempt.size === 0 && wordsToRequest > 0) {
        //   console.warn(
        //     `No new unique words added in attempt ${
        //       currentRetry + 1
        //     }. Breaking retry loop.`
        //   );
        //   apiWarning = `AI struggled to generate new unique words after multiple attempts.`;
        //   break;
        // }
        if (wordsAddedThisAttempt.size === 0 && wordsToRequest > 0) {
          console.warn(
            `No new unique words added in attempt ${currentRetry + 1}.`
          );

          if (currentRetry >= 3) {
            console.info(
              `Attempt ${currentRetry + 1}: AI is stuck. Trying relaxed prompt.`
            );

            const relaxedPrompt = `Generate ${wordsToRequest} simple and appropriate words for all ages related to the theme "${theme}".
        Avoid repeating these recent words: ${Array.from(collectedWords)
          .slice(-20)
          .join(", ")}.
        Respond only with a JSON array of words like ["word1", "word2"].`;

            try {
              const relaxedResponse = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${openRouterApiKey}`,
                    "HTTP-Referer":
                      process.env.NEXT_PUBLIC_SITE_URL ||
                      "http://localhost:3000",
                    "X-Title": "Word Search Puzzle Generator",
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    model: "openai/gpt-4o-mini",
                    temperature: 0.9,
                    presence_penalty: 1.2,
                    max_tokens: 4000,
                    messages: [
                      {
                        role: "system",
                        content:
                          "You are a word search puzzle generator. Generate family-friendly, simple, unique words. Respond with JSON array only.",
                      },
                      {
                        role: "user",
                        content: relaxedPrompt,
                      },
                    ],
                  }),
                }
              );

              const relaxedData = await relaxedResponse.json();
              const aiRelaxed = relaxedData.choices[0]?.message?.content;

              if (aiRelaxed) {
                let fallbackWords: string[];
                try {
                  const cleanRelaxed = aiRelaxed
                    .replace(/```json\n?|\n?```/g, "")
                    .trim();
                  fallbackWords = JSON.parse(cleanRelaxed);
                } catch {
                  const matches = aiRelaxed.match(/"([^"]+)"/g);
                  fallbackWords =
                    matches?.map((m: any) => m.replace(/"/g, "")) ?? [];
                }

                fallbackWords
                  .filter((w) => w.length >= 3 && w.length <= 12)
                  .map((w) =>
                    w
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .trim()
                  )
                  .forEach((w) => {
                    if (!collectedWords.has(w)) collectedWords.add(w);
                  });
              }
            } catch (relaxedError) {
              console.warn("Relaxed fetch failed:", relaxedError);
            }

            break; // On sort après ce fallback
          }

          currentRetry++;
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          continue;
        }
      } catch (fetchError: any) {
        console.error(
          `Fetch error on server retry ${currentRetry + 1}:`,
          fetchError.message || fetchError
        );
        apiWarning = `Network error on retry ${currentRetry + 1}: ${
          fetchError.message
        }.`;
        break;
      }

      currentRetry++;
      if (
        collectedWords.size < totalWordCount &&
        currentRetry < maxApiRetries
      ) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    const finalWords = Array.from(collectedWords).slice(0, totalWordCount);

    if (finalWords.length < totalWordCount && !apiWarning) {
      apiWarning = `AI could only generate ${finalWords.length} unique words out of ${totalWordCount} requested after multiple attempts. Some puzzles may have fewer words.`;
    }

    return NextResponse.json({ words: finalWords, warning: apiWarning });
  } catch (error: any) {
    console.error("Error generating words (server):", error.message || error);
    return NextResponse.json(
      {
        words: [],
        error:
          error.message ||
          "Failed to generate words due to an internal server error.",
      },
      { status: 500 }
    );
  }
}
