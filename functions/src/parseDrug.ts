import isHtml from 'is-html';
import { parse } from 'himalaya';

export function parseDrug(drug) {
  if (Array.isArray(drug)) return drug.map(parseDrug);

  return Object.entries(drug).reduce((result, [key, value]) => {
    const current = {};
    if (typeof value === 'object') {
      current[key] = parseDrug(value);
    } else if (typeof value === 'string' && isHtml(value)) {
      current[key] = parse(value);
    } else {
      current[key] = value;
    }

    return {
      ...result,
      ...current,
    }
  }, {})
}
