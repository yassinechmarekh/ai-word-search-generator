import jsPDF from "jspdf";
import { callAddFont as callAddFontNormal } from "../public/fonts/Comic-Sans-MS-normal";
import { callAddFont as callAddFontBold } from "../public/fonts/Comic-Sans-MS-bold";

jsPDF.API.events.push(["addFonts", callAddFontNormal]);
jsPDF.API.events.push(["addFonts", callAddFontBold]);

interface Puzzle {
  id: number;
  words: string[];
  grid: string[][];
  solution: boolean[][];
}

// Add this function before the generatePDF function
const drawDashedRect = (
  pdf: any,
  x: number,
  y: number,
  width: number,
  height: number,
  dashLength = 2
) => {
  const dashGap = dashLength;

  // Top line
  for (let i = 0; i < width; i += dashLength + dashGap) {
    const lineWidth = Math.min(dashLength, width - i);
    pdf.line(x + i, y, x + i + lineWidth, y);
  }

  // Bottom line
  for (let i = 0; i < width; i += dashLength + dashGap) {
    const lineWidth = Math.min(dashLength, width - i);
    pdf.line(x + i, y + height, x + i + lineWidth, y + height);
  }

  // Left line
  for (let i = 0; i < height; i += dashLength + dashGap) {
    const lineHeight = Math.min(dashLength, height - i);
    pdf.line(x, y + i, x, y + i + lineHeight);
  }

  // Right line
  for (let i = 0; i < height; i += dashLength + dashGap) {
    const lineHeight = Math.min(dashLength, height - i);
    pdf.line(x + width, y + i, x + width, y + i + lineHeight);
  }
};

export async function generatePDF(
  puzzles: Puzzle[],
  theme: string,
  templateName: string
): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4");
  pdf.setFont("Comic Sans MS", "normal");
  pdf.setFont("Comic Sans MS", "bold");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const GRID_SIZE = 20;
  const CELL_SIZE = 8;
  const gridHeight = GRID_SIZE * CELL_SIZE;

  const titleHeight = 10;
  const themeHeight = 10;
  const instructionsHeight = 10;
  const spacingAfterGrid = 10;

  // Constantes pour la liste de mots
  const wordsPerRow = 3;
  const maxWords = Math.max(...puzzles.map((p) => p.words.length));
  const maxWordRows = Math.ceil(maxWords / wordsPerRow);
  const wordListTitleHeight = 5;
  const wordListLineHeight = 8;
  const wordListHeight =
    wordListTitleHeight + 15 + maxWordRows * wordListLineHeight;

  // Hauteur totale du contenu
  const totalContentHeight =
    titleHeight +
    themeHeight +
    instructionsHeight +
    gridHeight +
    spacingAfterGrid +
    wordListHeight;

  // Décalage vertical global pour centrer
  const verticalStartY = (pageHeight - totalContentHeight) / 2;

  // Positions fixes à utiliser partout
  const titleY = verticalStartY + titleHeight / 2;
  const themeY = titleY + themeHeight;
  const instructionY1 = themeY + 8;
  const instructionY2 = instructionY1 + 5;
  const GRID_START_Y = instructionY2 + 10;
  const wordsStartY = GRID_START_Y + gridHeight + spacingAfterGrid;

  // Define grid parameters (template-specific sizing)
  let GRID_START_X: number;

  // Calculate grid positioning - CENTRÉ
  GRID_START_X = (pageWidth - GRID_SIZE * CELL_SIZE) / 2;

  // Define word list parameters - CENTRÉ
  const totalWordsWidth = pageWidth * 0.8; // 80% de la largeur de la page
  const columnWidth = totalWordsWidth / wordsPerRow;
  const startX = (pageWidth - totalWordsWidth) / 2; // Centré horizontalement
  //   const wordsStartY = GRID_START_Y + GRID_SIZE * CELL_SIZE + 15; // Plus d'espace après la grille

  // Template-specific styles
  let titleFont: [string, string] = ["helvetica", "bold"];
  let bodyFont: [string, string] = ["helvetica", "normal"];
  let gridFont: [string, string] = ["courier", "bold"];
  let gridBorderColor: [number, number, number] = [0, 0, 0]; // RGB for black
  let gridLineWidth = 1.5;
  let cellBorderColor: [number, number, number] = [150, 150, 150]; // RGB for gray
  let cellLineWidth = 0.2;
  let showCheckboxes = false;
  let wordListFontSize = 11;

  switch (templateName) {
    case "Theme 1 (Checkboxes)":
      titleFont = ["Comic Sans MS", "bold"];
      bodyFont = ["Comic Sans MS", "normal"];
      gridFont = ["courier", "bold"];
      gridBorderColor = [0, 0, 0];
      gridLineWidth = 1.0;
      cellBorderColor = [100, 100, 100];
      cellLineWidth = 0.2;
      showCheckboxes = true;
      wordListFontSize = 11;
      break;
    case "Theme 2 (Dashed)":
      titleFont = ["Comic Sans MS", "bold"];
      bodyFont = ["Comic Sans MS", "normal"];
      gridFont = ["helvetica", "bold"];
      gridBorderColor = [0, 0, 0]; // Black border
      gridLineWidth = 1.0;
      cellBorderColor = [100, 100, 100]; // Medium gray
      cellLineWidth = 0.3;
      showCheckboxes = false;
      wordListFontSize = 11;
      break;
    case "Theme 3 (Table)":
      titleFont = ["Comic Sans MS", "bold"];
      bodyFont = ["Comic Sans MS", "normal"];
      gridFont = ["courier", "bold"];
      gridBorderColor = [0, 0, 0];
      gridLineWidth = 1;
      cellBorderColor = [100, 100, 100];
      cellLineWidth = 0.2;
      showCheckboxes = false;
      wordListFontSize = 12;
      break;
    default:
      // Fallback to Classic
      titleFont = ["helvetica", "bold"];
      bodyFont = ["helvetica", "normal"];
      gridFont = ["courier", "bold"];
      gridBorderColor = [0, 0, 0];
      gridLineWidth = 1.5;
      cellBorderColor = [150, 150, 150];
      cellLineWidth = 0.2;
      showCheckboxes = true;
      wordListFontSize = 11;
      break;
  }

  // Function to draw a checkbox (only if enabled by template)
  const drawCheckbox = (x: number, y: number, checked: boolean) => {
    if (!showCheckboxes) return; // Don't draw if checkboxes are disabled for this template
    const size = 3.5; // Size of the checkbox square
    pdf.setDrawColor(0, 0, 0); // Black border
    pdf.setLineWidth(0.3);
    pdf.rect(x, y, size, size); // Draw the square

    if (checked) {
      // Draw a checkmark (simple V shape)
      pdf.setLineWidth(0.5);
      pdf.line(x + size * 0.2, y + size * 0.5, x + size * 0.5, y + size * 0.8);
      pdf.line(x + size * 0.5, y + size * 0.8, x + size * 0.8, y + size * 0.2);
    }
  };

  // --- Generate all Puzzle Pages First ---
  puzzles.forEach((puzzle, i) => {
    if (i > 0) {
      pdf.addPage();
    }

    // Add title and theme
    if (templateName === "Theme 2 (Dashed)") {
      // Draw dashed border around title - CENTRÉ
      const titleBoxWidth = 120;
      const titleBoxX = (pageWidth - titleBoxWidth) / 2;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      drawDashedRect(pdf, titleBoxX, titleY - 14, titleBoxWidth, 12);

      // Add title with # symbol
      pdf.setFontSize(20);
      pdf.setFont(titleFont[0], titleFont[1]);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`# PUZZLE ${puzzle.id}`, pageWidth / 2, titleY - 5, {
        align: "center",
      });

      pdf.setFontSize(16);
      pdf.setFont(bodyFont[0], bodyFont[1]);
      pdf.setTextColor(50, 50, 50);
      pdf.text(`Theme: ${theme}`, pageWidth / 2, themeY, { align: "center" });

      // Add instructions
      pdf.setFontSize(12);
      pdf.setFont(bodyFont[0], bodyFont[1]);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Find and circle the ${puzzle.words.length} hidden words in the grid below.`,
        pageWidth / 2,
        instructionY1,
        {
          align: "center",
        }
      );
      pdf.setFontSize(10);
      pdf.text(
        "Words can be found horizontally, vertically, or diagonally in any direction.",
        pageWidth / 2,
        instructionY2,
        {
          align: "center",
        }
      );
    } else {
      // Original title logic for other templates - POSITIONS AJUSTÉES
      pdf.setFontSize(28);
      pdf.setFont(titleFont[0], titleFont[1]);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`# Puzzle ${puzzle.id}`, pageWidth / 2, titleY, {
        align: "center",
      });

      pdf.setFontSize(16);
      pdf.setFont(bodyFont[0], bodyFont[1]);
      pdf.setTextColor(50, 50, 50);
      pdf.text(`Theme: ${theme}`, pageWidth / 2, themeY, {
        align: "center",
      });

      // Add instructions
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Find and circle the ${puzzle.words.length} hidden words in the grid below.`,
        pageWidth / 2,
        instructionY1,
        {
          align: "center",
        }
      );
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text(
        "Words can be found horizontally, vertically, or diagonally in any direction.",
        pageWidth / 2,
        instructionY2,
        {
          align: "center",
        }
      );
    }

    // Draw puzzle grid
    pdf.setDrawColor(
      gridBorderColor[0],
      gridBorderColor[1],
      gridBorderColor[2]
    );
    pdf.setLineWidth(gridLineWidth);
    pdf.rect(
      GRID_START_X,
      GRID_START_Y,
      GRID_SIZE * CELL_SIZE,
      GRID_SIZE * CELL_SIZE
    );

    pdf.setFontSize(10);
    pdf.setFont(gridFont[0], gridFont[1]);
    pdf.setTextColor(0, 0, 0);

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = GRID_START_X + col * CELL_SIZE;
        const y = GRID_START_Y + row * CELL_SIZE;

        pdf.setDrawColor(
          cellBorderColor[0],
          cellBorderColor[1],
          cellBorderColor[2]
        );
        pdf.setLineWidth(cellLineWidth);
        pdf.rect(x, y, CELL_SIZE, CELL_SIZE);

        const letter = puzzle.grid[row][col];
        pdf.text(letter, x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 1.5, {
          align: "center",
        });
      }
    }

    // Add words list
    if (templateName === "Theme 2 (Dashed)") {
      // Draw dashed border around words section
      const wordsBoxY = wordsStartY;
      const wordsBoxHeight =
        Math.ceil(puzzle.words.length / wordsPerRow) * wordListLineHeight + 20;
      const wordsBoxWidth = totalWordsWidth;
      const wordsBoxX = (pageWidth - wordsBoxWidth) / 2;

      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      drawDashedRect(pdf, wordsBoxX, wordsBoxY, wordsBoxWidth, wordsBoxHeight);

      // Add words section title
      pdf.setFontSize(14);
      pdf.setFont(titleFont[0], titleFont[1]);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Words to find :", pageWidth / 2, wordsBoxY + 10, {
        align: "center",
      });

      pdf.setFontSize(wordListFontSize);
      pdf.setFont(bodyFont[0], bodyFont[1]);
      pdf.setTextColor(0, 0, 0);

      puzzle.words.forEach((word, index) => {
        const column = index % wordsPerRow;
        const row = Math.floor(index / wordsPerRow);
        const x = startX + column * columnWidth + columnWidth / 2; // Centré dans chaque colonne
        const y = wordsBoxY + 20 + row * wordListLineHeight;

        pdf.text(word.toUpperCase(), x, y, { align: "center" });
      });
    } else if (templateName === "Theme 3 (Table)") {
      const wordsBoxY = wordsStartY;
      const cellH = 10;
      const cellW = totalWordsWidth / wordsPerRow;
      const rows = Math.ceil(puzzle.words.length / wordsPerRow);
      const tableWidth = totalWordsWidth;
      const tableX = (pageWidth - tableWidth) / 2;
      const tableY = wordsBoxY + 10;

      // Title box - CENTRÉ
      pdf.setFontSize(13);
      pdf.setFont(titleFont[0], titleFont[1]);
      pdf.setLineWidth(0.7);
      pdf.setDrawColor(0, 0, 0);
      pdf.setTextColor(0, 0, 0);
      pdf.rect(tableX, wordsBoxY, tableWidth, 10);
      pdf.text("Words to find :", pageWidth / 2, wordsBoxY + 7, {
        align: "center",
      });

      // Draw table borders and words
      pdf.setFontSize(wordListFontSize);
      pdf.setFont(bodyFont[0], bodyFont[1]);
      pdf.setLineWidth(0.7);
      pdf.setDrawColor(0, 0, 0);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < wordsPerRow; col++) {
          const wordIndex = row * wordsPerRow + col;
          if (wordIndex >= puzzle.words.length) break;

          const word = puzzle.words[wordIndex].toUpperCase();
          const x = tableX + col * cellW;
          const y = tableY + row * cellH;

          // Cell border
          pdf.rect(x, y, cellW, cellH);

          // Word centered in cell
          pdf.text(word, x + cellW / 2, y + cellH / 2 + 2.5, {
            align: "center",
          });
        }
      }
    } else {
      // Original words list logic for other templates - CENTRÉ
      pdf.setFontSize(14);
      pdf.setFont(titleFont[0], titleFont[1]);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Words to Find:", pageWidth / 2, wordsStartY + 5, {
        align: "center",
      });

      pdf.setFontSize(wordListFontSize);
      pdf.setFont(bodyFont[0], bodyFont[1]);
      pdf.setTextColor(0, 0, 0);

      puzzle.words.forEach((word, index) => {
        const column = index % wordsPerRow;
        const row = Math.floor(index / wordsPerRow);
        const x = startX + column * columnWidth;
        const y = wordsStartY + 15 + row * wordListLineHeight;

        if (showCheckboxes) {
          const checkboxX = x + (columnWidth - 5) / 2 - 20; // Centré avec espace pour checkbox
          drawCheckbox(checkboxX, y - 3, false);
          pdf.text(word.toUpperCase(), checkboxX + 8, y, { align: "left" });
        } else {
          if (templateName === "Modern (Clean)") {
            pdf.text(
              `${index + 1}. ${word.toUpperCase()}`,
              x + columnWidth / 2,
              y,
              { align: "center" }
            );
          } else {
            pdf.text(`• ${word.toUpperCase()}`, x + columnWidth / 2, y, {
              align: "center",
            });
          }
        }
      });
    }
  });

  // --- Generate all Answer Pages Second ---
  puzzles.forEach((puzzle, i) => {
    pdf.addPage(); // Always add a new page for each answer key

    // Answer page title
    if (templateName === "Theme 2 (Dashed)") {
      // Draw dashed border around answer title - CENTRÉ
      const titleBoxWidth = 120;
      const titleBoxX = (pageWidth - titleBoxWidth) / 2;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      drawDashedRect(pdf, titleBoxX, titleY - 14, titleBoxWidth, 12);

      // Answer page title
      pdf.setFontSize(20);
      pdf.setFont(titleFont[0], titleFont[1]);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`# ANSWER ${puzzle.id}`, pageWidth / 2, titleY - 5, {
        align: "center",
      });

      pdf.setFontSize(16);
      pdf.setFont(bodyFont[0], bodyFont[1]);
      pdf.setTextColor(50, 50, 50);
      pdf.text(`Theme: ${theme}`, pageWidth / 2, themeY, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont(bodyFont[0], bodyFont[1]);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        "Did you find them all? Check your answers below!",
        pageWidth / 2,
        instructionY1,
        { align: "center" }
      );
    } else {
      // Original answer title logic - POSITIONS AJUSTÉES
      pdf.setFontSize(28);
      pdf.setFont(titleFont[0], titleFont[1]);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`# Answer ${puzzle.id}`, pageWidth / 2, titleY, {
        align: "center",
      });

      pdf.setFontSize(16);
      pdf.setFont(bodyFont[0], bodyFont[1]);
      pdf.setTextColor(50, 50, 50);
      pdf.text(`Theme: ${theme}`, pageWidth / 2, themeY, { align: "center" });

      // Add instructions
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Did you find them all? Check your answers below!`,
        pageWidth / 2,
        instructionY1,
        {
          align: "center",
        }
      );
    }

    // Draw solution grid
    pdf.setFontSize(10);
    pdf.setFont(gridFont[0], gridFont[1]);

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = GRID_START_X + col * CELL_SIZE;
        const y = GRID_START_Y + row * CELL_SIZE;

        if (puzzle.solution[row][col]) {
          pdf.setFillColor(220, 220, 220); // Light gray fill
          pdf.rect(x, y, CELL_SIZE, CELL_SIZE, "F");
          pdf.setTextColor(0, 0, 0); // Black text for highlighted cells
        } else {
          pdf.setTextColor(128, 128, 128); // Gray text for non-solution cells
        }

        pdf.setDrawColor(
          cellBorderColor[0],
          cellBorderColor[1],
          cellBorderColor[2]
        );
        pdf.setLineWidth(cellLineWidth);
        pdf.rect(x, y, CELL_SIZE, CELL_SIZE);

        const letter = puzzle.grid[row][col];
        pdf.text(letter, x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 1.5, {
          align: "center",
        });
      }
    }

    pdf.setDrawColor(
      gridBorderColor[0],
      gridBorderColor[1],
      gridBorderColor[2]
    );
    pdf.setLineWidth(gridLineWidth);
    pdf.rect(
      GRID_START_X,
      GRID_START_Y,
      GRID_SIZE * CELL_SIZE,
      GRID_SIZE * CELL_SIZE
    );

    // Add words list for answer key
    if (templateName === "Theme 2 (Dashed)") {
      // Draw dashed border around words found section
      const wordsBoxY = wordsStartY;
      const wordsBoxHeight =
        Math.ceil(puzzle.words.length / wordsPerRow) * wordListLineHeight + 20;
      const wordsBoxWidth = totalWordsWidth;
      const wordsBoxX = (pageWidth - wordsBoxWidth) / 2;

      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      drawDashedRect(pdf, wordsBoxX, wordsBoxY, wordsBoxWidth, wordsBoxHeight);

      // Add words found section title
      pdf.setFontSize(14);
      pdf.setFont(titleFont[0], titleFont[1]);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Words found:", pageWidth / 2, wordsBoxY + 10, {
        align: "center",
      });

      pdf.setFontSize(wordListFontSize);
      pdf.setFont(bodyFont[0], bodyFont[1]);
      pdf.setTextColor(0, 0, 0);

      puzzle.words.forEach((word, index) => {
        const column = index % wordsPerRow;
        const row = Math.floor(index / wordsPerRow);
        const x = startX + column * columnWidth + columnWidth / 2; // Centré dans chaque colonne
        const y = wordsBoxY + 20 + row * wordListLineHeight;

        pdf.text(word.toUpperCase(), x, y, { align: "center" });
      });
    } else if (templateName === "Theme 3 (Table)") {
      const wordsBoxY = wordsStartY;
      const cellH = 10;
      const cellW = totalWordsWidth / wordsPerRow;
      const rows = Math.ceil(puzzle.words.length / wordsPerRow);
      const tableWidth = totalWordsWidth;
      const tableX = (pageWidth - tableWidth) / 2;
      const tableY = wordsBoxY + 10;

      // Title box
      pdf.setFontSize(13);
      pdf.setFont(titleFont[0], titleFont[1]);
      pdf.setLineWidth(0.7);
      pdf.setDrawColor(0, 0, 0);
      pdf.setTextColor(0, 0, 0);
      pdf.rect(tableX, wordsBoxY, tableWidth, 10);
      pdf.text("Words found:", pageWidth / 2, wordsBoxY + 7, {
        align: "center",
      });

      // Draw table borders and words
      pdf.setFontSize(wordListFontSize);
      pdf.setFont(bodyFont[0], bodyFont[1]);
      pdf.setLineWidth(0.7);
      pdf.setDrawColor(0, 0, 0);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < wordsPerRow; col++) {
          const wordIndex = row * wordsPerRow + col;
          if (wordIndex >= puzzle.words.length) break;

          const word = puzzle.words[wordIndex].toUpperCase();
          const x = tableX + col * cellW;
          const y = tableY + row * cellH;

          // Cell border
          pdf.rect(x, y, cellW, cellH);

          // Word centered in cell
          pdf.text(word, x + cellW / 2, y + cellH / 2 + 2.5, {
            align: "center",
          });
        }
      }
    } else {
      // Original answer words list logic - CENTRÉ
      pdf.setFontSize(14);
      pdf.setFont(titleFont[0], titleFont[1]);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Words Found:", pageWidth / 2, wordsStartY + 5, {
        align: "center",
      });

      pdf.setFontSize(wordListFontSize);
      pdf.setFont(bodyFont[0], bodyFont[1]);
      pdf.setTextColor(0, 0, 0);

      puzzle.words.forEach((word, index) => {
        const column = index % wordsPerRow;
        const row = Math.floor(index / wordsPerRow);
        const x = startX + column * columnWidth;
        const y = wordsStartY + 15 + row * wordListLineHeight;

        if (showCheckboxes) {
          const checkboxX = x + (columnWidth - 5) / 2 - 20; // Centré avec espace pour checkbox
          drawCheckbox(checkboxX, y - 3, true); // Checkbox is checked for answer key
          pdf.text(word.toUpperCase(), checkboxX + 8, y, { align: "left" });
        } else {
          if (templateName === "Modern (Clean)") {
            pdf.text(
              `${index + 1}. ${word.toUpperCase()}`,
              x + columnWidth / 2,
              y,
              { align: "center" }
            );
          } else {
            pdf.text(`• ${word.toUpperCase()}`, x + columnWidth / 2, y, {
              align: "center",
            });
          }
        }
      });
    }
  });

  // Download the PDF
  pdf.save(
    `word-search-puzzles-${theme
      .toLowerCase()
      .replace(/\s+/g, "-")}-${templateName
      .toLowerCase()
      .replace(/\s+/g, "-")}.pdf`
  );
}
