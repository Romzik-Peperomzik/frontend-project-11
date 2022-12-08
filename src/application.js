import axios from 'axios';
import i18next from 'i18next';
import { isPlainObject, uniqueId } from 'lodash';
import { string, setLocale } from 'yup';
import rawXMLparser from './parser.js';
import viewWatchedState from './view.js';
import resources from './locales/index.js';

const updatePeriod = 5000;

const validateURL = (channels, url) => {
  const schema = string().url().notOneOf(channels);
  return schema.validate(url);
};

const addIDForParsedData = (data) => {
  if (isPlainObject(data)) return { ...data, id: uniqueId() };
  return data.map((dataItem) => ({ ...dataItem, id: uniqueId() }));
};

const grabNewPosts = (posts, state) => posts.filter((parsedPost) => state.posts.every(
  (post) => parsedPost.title !== post.title,
));

const getFeed = (url) => axios
  .get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
  .then((response) => response.data.contents);

const updatePosts = (url, state) => getFeed(url)
  .then((rawXML) => {
    const [, parsedPosts] = rawXMLparser(rawXML)
      .map((parsedDataItem) => addIDForParsedData(parsedDataItem));
    const newPosts = grabNewPosts(parsedPosts, state);
    if (newPosts.length > 0) state.posts = [...newPosts, ...state.posts];
  })
  .finally(() => setTimeout(() => { updatePosts(url, state); }, updatePeriod));

const app = () => {
  const defaultLanguage = 'ru';
  const i18n = i18next.createInstance();
  i18n.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  })
    .then(() => {
      setLocale({
        string: {
          url: 'ui.rssForm.yup.invalidUrlError',
        },
        mixed: {
          notOneOf: 'ui.rssForm.yup.existUrlError',
        },
      });
      const initialState = {
        feeds: [],
        posts: [],
        ui: {
          visitedLinks: [],
          modalButtonID: '',
        },
        rssForm: {
          status: 'invalid',
          error: '',
        },
      };
      const elements = {
        form: document.querySelector('form'),
        input: document.getElementById('url-input'),
        formSubmitButton: document.querySelector('form .btn-primary'),
        feedback: document.querySelector('.feedback'),
        postsContainer: document.querySelector('.posts'),
        feedsContainer: document.querySelector('.feeds'),
        modalTitle: document.querySelector('.modal-title'),
        modalBody: document.querySelector('.modal-body'),
        modalMoreButton: document.querySelector('.full-article'),
        modalCloseButton: document.querySelector('.modal-footer > .btn-secondary'),
      };
      const channels = [];
      const state = viewWatchedState(initialState, elements, i18n);
      const { form, postsContainer } = elements;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        state.rssForm.status = 'processing';
        const formData = new FormData(e.target);
        const url = formData.get('url');
        validateURL(channels, url)
          .then(() => getFeed(url))
          .then((rawXML) => {
            const [parsedFeed, parsedPosts] = rawXMLparser(rawXML)
              .map((parsedDataItem) => addIDForParsedData(parsedDataItem));
            state.feeds.push(parsedFeed);
            const newPosts = grabNewPosts(parsedPosts, state);
            if (newPosts.length > 0) state.posts = [...newPosts, ...state.posts];
            channels.push(url);
            state.rssForm.status = 'success';
          })
          .then(() => setTimeout(() => { updatePosts(url, state); }, updatePeriod))
          .catch((err) => {
            state.rssForm.status = 'invalid';
            state.rssForm.error = err;
          });
      });

      postsContainer.addEventListener('click', (e) => {
        const { id } = e.target.dataset;
        if (id) {
          state.ui.modalButtonID = id;
          const a = document.querySelector(`a[data-id='${id}']`);
          const link = a.getAttribute('href');
          state.ui.visitedLinks.push(link);
        }
      });
    });
};

export default app;
