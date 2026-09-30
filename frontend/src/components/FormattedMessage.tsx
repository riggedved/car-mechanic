'use client';

import React from 'react';

interface FormattedMessageProps {
  content: string;
}

export default function FormattedMessage({ content }: FormattedMessageProps) {
  if (!content) return null;

  // Split into paragraphs / blocks by double newlines
  const rawBlocks = content.split(/\n\s*\n/);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
      {rawBlocks.map((rawBlock, blockIdx) => {
        const trimmed = rawBlock.trim();
        if (!trimmed) return null;

        const lines = trimmed.split('\n');

        // Check if all lines are bullet points (* item or - item or • item)
        const isBulletList = lines.every((line) => /^(\*|-|•)\s+/.test(line.trim()));
        if (isBulletList) {
          return (
            <ul
              key={blockIdx}
              style={{
                margin: '0.2rem 0',
                paddingLeft: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              {lines.map((line, lineIdx) => {
                const textWithoutBullet = line.trim().replace(/^(\*|-|•)\s+/, '');
                return (
                  <li
                    key={lineIdx}
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                      lineHeight: '22px',
                      color: '#dfe2ee',
                    }}
                  >
                    {renderInline(textWithoutBullet)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Check if all lines are numbered items (1. item, 2. item)
        const isNumberedList = lines.every((line) => /^\d+\.\s+/.test(line.trim()));
        if (isNumberedList) {
          return (
            <ol
              key={blockIdx}
              style={{
                margin: '0.2rem 0',
                paddingLeft: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              {lines.map((line, lineIdx) => {
                const textWithoutNumber = line.trim().replace(/^\d+\.\s+/, '');
                return (
                  <li
                    key={lineIdx}
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                      lineHeight: '22px',
                      color: '#dfe2ee',
                    }}
                  >
                    {renderInline(textWithoutNumber)}
                  </li>
                );
              })}
            </ol>
          );
        }

        // Check if block is a heading (e.g. ### Heading or ## Heading)
        if (lines.length === 1 && /^#{1,4}\s+/.test(lines[0])) {
          const headingText = lines[0].replace(/^#{1,4}\s+/, '');
          return (
            <h4
              key={blockIdx}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 700,
                color: '#ff6b00',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginTop: '0.3rem',
                marginBottom: '0.1rem',
              }}
            >
              {renderInline(headingText)}
            </h4>
          );
        }

        // Standard paragraph with possible single linebreaks
        return (
          <p
            key={blockIdx}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              lineHeight: '22px',
              color: '#dfe2ee',
              margin: 0,
            }}
          >
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {renderInline(line)}
                {lineIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Match **bold**, `code`, *italic*
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

  return tokens.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} style={{ color: '#fff', fontWeight: 700 }}>
          {inner}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          style={{
            background: '#1c2028',
            color: '#ff6b00',
            padding: '1px 6px',
            borderRadius: 4,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            border: '1px solid #262a33',
          }}
        >
          {inner}
        </code>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={idx} style={{ fontStyle: 'italic', color: '#cbd5e1' }}>
          {inner}
        </em>
      );
    }

    return part;
  });
}
