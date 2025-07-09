export const cutText = (text, maxLength = 2000) =>
  text.length > maxLength ? text.slice(0, maxLength) + '...' : text;

export const extractAppNames = documents => {
  const rawNames = documents.flatMap(doc => {
    const name = doc.name?.split('.')[0] || '';
    const folder = doc.folder || '';
    return [name, folder];
  });

  return [
    ...new Set(
      rawNames
        .map(name =>
          name
            .replace(/[_-]/g, ' ')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/\b(Doc|Documentation|Manual|Guide)\b/gi, '')
            .trim(),
        )
        .filter(Boolean),
    ),
  ];
};

export const detectMentionedApps = (message, appNames) => {
  const lower = message.toLowerCase();
  return appNames.filter(name => lower.includes(name.toLowerCase()));
};
