/**
 * Parse markdown-like syntax and return JSX-compatible content
 * Handles: **bold**, *italic*, lists, and line breaks
 */

import React from "react";

export function parseMarkdown(text: string): (string | React.ReactElement)[] {
  if (!text) return [];

  const result: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  const boldRegex = /\*\*(.+?)\*\*/g;
  const italicRegex = /\*(.+?)\*/g;
  let match;

  // Create a combined regex to handle both ** bold and * italic
  const combinedRegex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  const matches: Array<{ index: number; length: number; isBold: boolean; text: string }> = [];

  let prevMatch: RegExpExecArray | null;
  while ((match = combinedRegex.exec(text)) !== null) {
    const isBold = match[0].startsWith("**");
    const content = match[1] || match[2];
    matches.push({
      index: match.index,
      length: match[0].length,
      isBold,
      text: content,
    });
  }

  // Sort matches by index to process in order
  matches.sort((a, b) => a.index - b.index);

  // Process text with formatting
  let currentIndex = 0;
  matches.forEach((fmt) => {
    if (fmt.index > currentIndex) {
      result.push(text.substring(currentIndex, fmt.index));
    }
    if (fmt.isBold) {
      result.push(
        <strong key={`bold-${fmt.index}`} className="font-semibold text-foreground">
          {fmt.text}
        </strong>
      );
    } else {
      result.push(
        <em key={`italic-${fmt.index}`} className="italic">
          {fmt.text}
        </em>
      );
    }
    currentIndex = fmt.index + fmt.length;
  });

  // Add remaining text
  if (currentIndex < text.length) {
    result.push(text.substring(currentIndex));
  }

  return result.length > 0 ? result : [text];
}

/**
 * Convert markdown text to plain text (strips formatting)
 */
export function markdownToPlain(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1");
}

/**
 * Split text by line breaks and process each line for markdown
 */
export function parseMarkdownLines(text: string): React.ReactElement[] {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const parsed = parseMarkdown(line);
    return (
      <div key={`line-${idx}`} className="mb-1">
        {parsed}
      </div>
    );
  });
}
