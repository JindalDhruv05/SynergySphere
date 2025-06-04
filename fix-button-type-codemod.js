/**
 * Codemod to add type="button" to all <button> JSX elements missing a type attribute.
 * Usage: npx jscodeshift -t fix-button-type-codemod.js frontend/src
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root
    .find(j.JSXElement, { openingElement: { name: { type: 'JSXIdentifier', name: 'button' } } })
    .forEach(path => {
      const attributes = path.node.openingElement.attributes;
      const hasType = attributes.some(attr =>
        attr.type === 'JSXAttribute' && attr.name.name === 'type'
      );
      if (!hasType) {
        attributes.unshift(
          j.jsxAttribute(j.jsxIdentifier('type'), j.literal('button'))
        );
      }
    });

  return root.toSource({ quote: 'single' });
}
