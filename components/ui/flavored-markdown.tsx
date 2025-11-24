import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type FlavoredMarkdownProps = {
  content: string;
  isDark: boolean;
};

type ParsedNode =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'bold-italic'; content: string }
  | { type: 'strikethrough'; content: string }
  | { type: 'code'; content: string }
  | { type: 'link'; text: string; url: string }
  | { type: 'image'; url: string; height: number | null; alt?: string }
  | { type: 'center'; children: ParsedNode[] }
  | { type: 'line'; children: ParsedNode[] }
  | { type: 'header'; level: number; children: ParsedNode[] }
  | { type: 'blockquote'; level: number; children: ParsedNode[] }
  | { type: 'bullet-list'; items: ParsedNode[][] }
  | { type: 'numbered-list'; items: ParsedNode[][] }
  | { type: 'code-block'; content: string }
  | { type: 'horizontal-line' };

function parseInlineMarkdown(text: string): ParsedNode[] {
  const nodes: ParsedNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Check for image: img[height](url) or img(url)
    const imgMatch = remaining.match(/^img(\d*)\(([^)]+)\)/);
    if (imgMatch) {
      nodes.push({
        type: 'image',
        height: imgMatch[1] ? parseInt(imgMatch[1], 10) : null,
        url: imgMatch[2],
      });
      remaining = remaining.slice(imgMatch[0].length);
      continue;
    }

    // Check for markdown image: ![alt](url)
    const mdImgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (mdImgMatch) {
      nodes.push({
        type: 'image',
        height: null,
        url: mdImgMatch[2],
        alt: mdImgMatch[1],
      });
      remaining = remaining.slice(mdImgMatch[0].length);
      continue;
    }

    // Check for link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      nodes.push({
        type: 'link',
        text: linkMatch[1],
        url: linkMatch[2],
      });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Check for inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      nodes.push({ type: 'code', content: codeMatch[1] });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Check for bold+italic: ***text*** or ___text___
    const boldItalicMatch = remaining.match(/^(\*\*\*|___)(.+?)\1/);
    if (boldItalicMatch) {
      nodes.push({ type: 'bold-italic', content: boldItalicMatch[2] });
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // Check for bold: __text__ or **text**
    const boldMatch = remaining.match(/^(__|\*\*)(.+?)\1/);
    if (boldMatch) {
      nodes.push({ type: 'bold', content: boldMatch[2] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Check for strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      nodes.push({ type: 'strikethrough', content: strikeMatch[1] });
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Check for italic: _text_ or *text* (but not __ or **)
    const italicMatch = remaining.match(/^([_*])(?!\1)(.+?)\1(?!\1)/);
    if (italicMatch) {
      nodes.push({ type: 'italic', content: italicMatch[2] });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Find next special character
    const nextSpecial = remaining.search(/\*\*\*|___|__|\*\*|~~|_(?!_)|\*(?!\*)|`|\[|!\[|img\d*\(/);
    if (nextSpecial === -1) {
      nodes.push({ type: 'text', content: remaining });
      break;
    } else if (nextSpecial === 0) {
      // No match found, consume one character
      nodes.push({ type: 'text', content: remaining[0] });
      remaining = remaining.slice(1);
    } else {
      nodes.push({ type: 'text', content: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    }
  }

  return nodes;
}

function parseContent(content: string): ParsedNode[] {
  const nodes: ParsedNode[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for code block: ```...```
    if (trimmedLine.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push({ type: 'code-block', content: codeLines.join('\n') });
      i++; // Skip closing ```
      continue;
    }

    // Check for horizontal line: ---, ***, - - -, * * *
    if (/^[-*](\s*[-*]){2,}$/.test(trimmedLine) && trimmedLine.length >= 3) {
      nodes.push({ type: 'horizontal-line' });
      i++;
      continue;
    }

    // Check for center with ~~~text~~~
    const centerTildeMatch = trimmedLine.match(/^~~~(.+?)~~~$/);
    if (centerTildeMatch) {
      nodes.push({
        type: 'center',
        children: [{ type: 'line', children: parseInlineMarkdown(centerTildeMatch[1]) }],
      });
      i++;
      continue;
    }

    // Check for center with <center>...</center> (single line)
    const centerTagMatch = trimmedLine.match(/^<center>(.*?)<\/center>$/i);
    if (centerTagMatch) {
      nodes.push({
        type: 'center',
        children: [{ type: 'line', children: parseInlineMarkdown(centerTagMatch[1]) }],
      });
      i++;
      continue;
    }

    // Check for multiline <center>...</center>
    if (trimmedLine.toLowerCase() === '<center>') {
      const centerLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim().toLowerCase() !== '</center>') {
        centerLines.push(lines[i]);
        i++;
      }
      const centerChildren: ParsedNode[] = [];
      for (const centerLine of centerLines) {
        centerChildren.push({ type: 'line', children: parseInlineMarkdown(centerLine) });
      }
      nodes.push({ type: 'center', children: centerChildren });
      i++; // Skip </center>
      continue;
    }

    // Check for header: # text, ## text, etc.
    const headerMatch = line.match(/^(#{1,5})\s+(.+)$/);
    if (headerMatch) {
      nodes.push({
        type: 'header',
        level: headerMatch[1].length,
        children: parseInlineMarkdown(headerMatch[2]),
      });
      i++;
      continue;
    }

    // Check for blockquote: > text, >> text, etc.
    if (trimmedLine.startsWith('>')) {
      const quoteLines: { level: number; content: string }[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const quoteLine = lines[i].trim();
        const levelMatch = quoteLine.match(/^(>+)\s*(.*)/);
        if (levelMatch) {
          quoteLines.push({
            level: levelMatch[1].length,
            content: levelMatch[2],
          });
        }
        i++;
      }

      // Group by level and create nested blockquotes
      for (const quoteLine of quoteLines) {
        nodes.push({
          type: 'blockquote',
          level: quoteLine.level,
          children: parseInlineMarkdown(quoteLine.content),
        });
      }
      continue;
    }

    // Check for bullet list: - item, * item, + item
    const bulletMatch = line.match(/^(\s*)([-*+])\s+(.+)$/);
    if (bulletMatch) {
      const items: ParsedNode[][] = [];
      const baseIndent = bulletMatch[1].length;

      while (i < lines.length) {
        const listLine = lines[i];
        const listMatch = listLine.match(/^(\s*)([-*+])\s+(.+)$/);
        if (listMatch && listMatch[1].length === baseIndent) {
          items.push(parseInlineMarkdown(listMatch[3]));
          i++;
        } else {
          break;
        }
      }

      nodes.push({ type: 'bullet-list', items });
      continue;
    }

    // Check for numbered list: 1. item, 2. item, etc.
    const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const items: ParsedNode[][] = [];
      const baseIndent = numberedMatch[1].length;

      while (i < lines.length) {
        const listLine = lines[i];
        const listMatch = listLine.match(/^(\s*)(\d+)\.\s+(.+)$/);
        if (listMatch && listMatch[1].length === baseIndent) {
          items.push(parseInlineMarkdown(listMatch[3]));
          i++;
        } else {
          break;
        }
      }

      nodes.push({ type: 'numbered-list', items });
      continue;
    }

    // Regular line
    nodes.push({ type: 'line', children: parseInlineMarkdown(line) });
    i++;
  }

  return nodes;
}

function AutoSizeImage({ url }: { url: string }) {
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    Image.getSize(
      url,
      (width, height) => {
        if (width && height) {
          setAspectRatio(width / height);
        }
      },
      () => {
        setError(true);
      }
    );
  }, [url]);

  if (error) {
    return null;
  }

  return (
    <View style={styles.imageWrapper}>
      <Image
        source={{ uri: url }}
        style={[
          styles.image,
          styles.fullWidthImage,
          aspectRatio ? { aspectRatio } : { height: 200 },
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

function FixedHeightImage({ url, height }: { url: string; height: number }) {
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);

  useEffect(() => {
    Image.getSize(
      url,
      (width, imgHeight) => {
        if (width && imgHeight) {
          setAspectRatio(width / imgHeight);
        }
      },
      () => {
        // On error, use square aspect ratio
      }
    );
  }, [url]);

  // Calculate width based on height and aspect ratio
  const calculatedWidth = aspectRatio ? height * aspectRatio : undefined;

  return (
    <View style={styles.imageWrapper}>
      <Image
        source={{ uri: url }}
        style={[
          styles.image,
          {
            height,
            width: calculatedWidth ?? '100%',
            maxWidth: '100%',
          },
        ]}
        resizeMode={aspectRatio ? 'cover' : 'contain'}
      />
    </View>
  );
}

function RenderInlineNode({
  node,
  isDark,
  centered,
}: {
  node: ParsedNode;
  isDark: boolean;
  centered?: boolean;
}) {
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const textAlignStyle = centered ? styles.centeredText : undefined;

  switch (node.type) {
    case 'text':
      return (
        <Text style={[styles.text, textAlignStyle, { color: textColor }]}>
          {node.content}
        </Text>
      );
    case 'bold':
      return (
        <Text style={[styles.text, styles.bold, textAlignStyle, { color: textColor }]}>
          {node.content}
        </Text>
      );
    case 'italic':
      return (
        <Text style={[styles.text, styles.italic, textAlignStyle, { color: textColor }]}>
          {node.content}
        </Text>
      );
    case 'bold-italic':
      return (
        <Text style={[styles.text, styles.bold, styles.italic, textAlignStyle, { color: textColor }]}>
          {node.content}
        </Text>
      );
    case 'strikethrough':
      return (
        <Text style={[styles.text, styles.strikethrough, textAlignStyle, { color: textColor }]}>
          {node.content}
        </Text>
      );
    case 'code':
      return (
        <Text
          style={[
            styles.inlineCode,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: isDark ? '#E879F9' : '#9333EA',
            },
          ]}
        >
          {node.content}
        </Text>
      );
    case 'link':
      return (
        <TouchableOpacity onPress={() => Linking.openURL(node.url)}>
          <Text style={[styles.text, styles.link]}>{node.text}</Text>
        </TouchableOpacity>
      );
    case 'image':
      if (node.height) {
        return <FixedHeightImage url={node.url} height={node.height} />;
      }
      return <AutoSizeImage url={node.url} />;
    default:
      return null;
  }
}

function RenderLine({
  node,
  isDark,
  centered,
}: {
  node: ParsedNode;
  isDark: boolean;
  centered?: boolean;
}) {
  if (node.type !== 'line') return null;

  // Check if line contains only an image
  const hasOnlyImage = node.children.length === 1 && node.children[0].type === 'image';

  if (hasOnlyImage) {
    return (
      <View style={styles.imageContainer}>
        <RenderInlineNode node={node.children[0]} isDark={isDark} centered={centered} />
      </View>
    );
  }

  // Check if line is empty or only whitespace
  const isEmpty = node.children.every(
    (child) => child.type === 'text' && child.content.trim() === ''
  );

  if (isEmpty) {
    return <View style={styles.emptyLine} />;
  }

  return (
    <Text style={[styles.lineContainer, centered && styles.centeredText]}>
      {node.children.map((child, index) => (
        <RenderInlineNode key={index} node={child} isDark={isDark} centered={centered} />
      ))}
    </Text>
  );
}

function RenderNode({
  node,
  isDark,
  centered,
}: {
  node: ParsedNode;
  isDark: boolean;
  centered?: boolean;
}) {
  const textColor = isDark ? '#ECEDEE' : '#11181C';

  switch (node.type) {
    case 'center':
      return (
        <View style={styles.centerContainer}>
          {node.children.map((child, index) => (
            <RenderNode key={index} node={child} isDark={isDark} centered />
          ))}
        </View>
      );
    case 'line':
      return <RenderLine node={node} isDark={isDark} centered={centered} />;
    case 'header':
      const headerSizes = [28, 24, 20, 18, 16];
      const headerSize = headerSizes[node.level - 1] || 16;
      return (
        <View style={styles.headerContainer}>
          <Text
            style={[
              styles.header,
              { fontSize: headerSize, color: textColor },
              centered && styles.centeredText,
            ]}
          >
            {node.children.map((child, index) => (
              <RenderInlineNode key={index} node={child} isDark={isDark} centered={centered} />
            ))}
          </Text>
        </View>
      );
    case 'blockquote':
      return (
        <View
          style={[
            styles.blockquote,
            {
              marginLeft: (node.level - 1) * 12,
              borderLeftColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            },
          ]}
        >
          <Text style={[styles.text, styles.italic, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
            {node.children.map((child, index) => (
              <RenderInlineNode key={index} node={child} isDark={isDark} />
            ))}
          </Text>
        </View>
      );
    case 'bullet-list':
      return (
        <View style={styles.listContainer}>
          {node.items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.bullet, { color: textColor }]}>•</Text>
              <Text style={[styles.listItemText, { color: textColor }]}>
                {item.map((child, childIndex) => (
                  <RenderInlineNode key={childIndex} node={child} isDark={isDark} />
                ))}
              </Text>
            </View>
          ))}
        </View>
      );
    case 'numbered-list':
      return (
        <View style={styles.listContainer}>
          {node.items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.number, { color: textColor }]}>{index + 1}.</Text>
              <Text style={[styles.listItemText, { color: textColor }]}>
                {item.map((child, childIndex) => (
                  <RenderInlineNode key={childIndex} node={child} isDark={isDark} />
                ))}
              </Text>
            </View>
          ))}
        </View>
      );
    case 'code-block':
      return (
        <View
          style={[
            styles.codeBlock,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <Text
            style={[
              styles.codeBlockText,
              { color: isDark ? '#E879F9' : '#9333EA' },
            ]}
          >
            {node.content}
          </Text>
        </View>
      );
    case 'horizontal-line':
      return (
        <View
          style={[
            styles.horizontalLine,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' },
          ]}
        />
      );
    default:
      return <RenderInlineNode node={node} isDark={isDark} centered={centered} />;
  }
}

export function FlavoredMarkdown({ content, isDark }: FlavoredMarkdownProps) {
  const parsedNodes = useMemo(() => parseContent(content), [content]);

  return (
    <View style={styles.container}>
      {parsedNodes.map((node, index) => (
        <RenderNode key={index} node={node} isDark={isDark} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  centerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  lineContainer: {
    minHeight: 20,
  },
  centeredText: {
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  emptyLine: {
    height: 10,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  link: {
    color: '#6366F1',
    textDecorationLine: 'underline',
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imageWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  image: {
    borderRadius: 8,
  },
  fullWidthImage: {
    width: '100%',
  },
  headerContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    fontWeight: '700',
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 4,
    marginVertical: 4,
  },
  listContainer: {
    marginVertical: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  bullet: {
    width: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  number: {
    width: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  codeBlock: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginVertical: 8,
  },
  codeBlockText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  horizontalLine: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
});
