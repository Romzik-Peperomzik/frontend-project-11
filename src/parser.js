const parsePost = (element) => ({
  title: element.querySelector('title').textContent,
  description: element.querySelector('description').textContent,
  link: element.querySelector('link').textContent,
});

export default (rawXML) => {
  const parser = new DOMParser();
  const XMLDocument = parser.parseFromString(rawXML, 'application/xml');
  const errorNode = XMLDocument.querySelector('parsererror');
  if (errorNode) throw new Error('ui.rssForm.parsing.XMLdocumentError');

  const parsedFeed = {
    title: XMLDocument.querySelector('title').textContent,
    description: XMLDocument.querySelector('description').textContent,
  };

  const posts = XMLDocument.querySelectorAll('item');
  const parsedPosts = Array.from(posts).map((post) => parsePost(post));
  return [parsedFeed, parsedPosts];
};
