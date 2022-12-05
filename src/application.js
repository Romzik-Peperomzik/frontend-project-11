import axios from 'axios';
import i18next from 'i18next';
import { isPlainObject, uniqueId } from 'lodash';
import { string, setLocale } from 'yup';
import rawXMLparser from './parser.js';
import viewWatchedState from './view.js';
import resources from './locales/index.js';

const validateURL = (channels, url) => {
  const schema = string().url().notOneOf(channels);
  return schema.validate(url);
};

const processPostsContainer = (state, elem) => {
  const { id } = elem.dataset;
  const a = document.querySelector(`a[data-id='${id}']`);
  const link = a.getAttribute('href');
  state.ui.modalButtonID = id;
  state.ui.visitedLinks.push(link);
};

const addIDForParsedData = (data) => {
  if (isPlainObject(data)) return { ...data, id: uniqueId() };
  return data.map((dataItem) => ({ ...dataItem, id: uniqueId() }));
};

const getFeed = (url, state) => {
  axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
    .then((response) => {
      if (response.status === 200) {
        state.rssForm.status = 'downloaded';
        return response.data.contents;
      }
      throw new Error('ui.rssForm.network.responseError');
    })
    .then((rawXML) => {
      const [parsedFeed, parsedPosts] = rawXMLparser(rawXML)
        .map((parsedDataItem) => addIDForParsedData(parsedDataItem));
      const isNewFeed = state.feeds.every(({ title }) => title !== parsedFeed.title);
      if (isNewFeed) state.feeds.push(parsedFeed);
      const newPosts = parsedPosts.filter((parsedPost) => state.posts.every(
        (post) => parsedPost.title !== post.title,
      ));
      if (newPosts.length > 0) state.posts = [...newPosts, ...state.posts];
    })
    .catch((err) => {
      state.rssForm.status = 'invalid';
      state.rssForm.errors = err;
    })
    .finally(() => setTimeout(() => { getFeed(url, state); }, state.updatePeriod));
};

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
        updatePeriod: 5000,
        feeds: [],
        posts: [],
        ui: {
          visitedLinks: [],
          modalButtonID: '',
        },
        rssForm: {
          status: 'invalid',
          errors: [],
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
      const { form, input, postsContainer } = elements;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = formData.get('url');
        validateURL(channels, url)
          .then(() => {
            state.rssForm.status = 'processing';
            getFeed(url, state);
            channels.push(url);
          })
          .catch((err) => {
            state.rssForm.status = 'invalid';
            state.rssForm.errors = err;
          });
        form.reset();
        input.focus();
      });

      postsContainer.addEventListener('click', (e) => {
        switch (e.target.nodeName) {
          case 'A':
          case 'BUTTON':
            processPostsContainer(state, e.target);
            break;
          default:
            throw new Error(`Node: ${e.target.nodeName} shouldn't be processed`);
        }
      });
    })
    .catch((err) => console.error(err));
};

export default app;
