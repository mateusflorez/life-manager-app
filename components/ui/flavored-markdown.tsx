import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export type FlavoredMarkdownProps = {
  content: string;
  isDark: boolean;
};

type ParsedNode =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'strikethrough'; content: string }
  | { type: 'image'; url: string; height: number | null }
  | { type: 'center'; children: ParsedNode[] }
  | { type: 'line'; children: ParsedNode[] };

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

    // Check for bold: __text__
    const boldMatch = remaining.match(/^__([^_]+)__/);
    if (boldMatch) {
      nodes.push({ type: 'bold', content: boldMatch[1] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Check for italic: _text_
    const italicMatch = remaining.match(/^_([^_]+)_/);
    if (italicMatch) {
      nodes.push({ type: 'italic', content: italicMatch[1] });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Check for strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~([^~]+)~~/);
    if (strikeMatch) {
      nodes.push({ type: 'strikethrough', content: strikeMatch[1] });
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Find next special character
    const nextSpecial = remaining.search(/__|_|~~|img\d*\(/);
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

  // Split by center tags
  const centerRegex = /<center>([\s\S]*?)<\/center>/g;
  let lastIndex = 0;
  let match;

  while ((match = centerRegex.exec(content)) !== null) {
    // Add content before center tag
    if (match.index > lastIndex) {
      const beforeContent = content.slice(lastIndex, match.index);
      const lines = beforeContent.split('\n');
      for (const line of lines) {
        nodes.push({ type: 'line', children: parseInlineMarkdown(line) });
      }
    }

    // Parse center content
    const centerContent = match[1];
    const centerLines = centerContent.split('\n');
    const centerChildren: ParsedNode[] = [];
    for (const line of centerLines) {
      centerChildren.push({ type: 'line', children: parseInlineMarkdown(line) });
    }
    nodes.push({ type: 'center', children: centerChildren });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining content after last center tag
  if (lastIndex < content.length) {
    const afterContent = content.slice(lastIndex);
    const lines = afterContent.split('\n');
    for (const line of lines) {
      nodes.push({ type: 'line', children: parseInlineMarkdown(line) });
    }
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
    case 'strikethrough':
      return (
        <Text style={[styles.text, styles.strikethrough, textAlignStyle, { color: textColor }]}>
          {node.content}
        </Text>
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
});
