import axios from 'axios';
import i18next from 'i18next';
import onChange from 'on-change';
import { string, setLocale } from 'yup';
import rawXMLparser from './parser.js';
import {
  renderRssFormFeedback,
  renderRssFormError,
  renderPostsCard,
  renderFeedsCard,
  renderVisitedLink,
} from './view.js';
import resources from './locales/index.js';

const validateURL = (state, url) => {
  const schema = string().url().notOneOf(state.channels);
  return schema.validate(url);
};

const getFeed = (initialState, state, url) => {
  axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
    .then((response) => {
      if (response.data.status.http_code === 200) {
        state.rssForm.status = 'downloaded';
        return response.data.contents;
      }
      throw new Error('networkResponseError');
    })
    .then((rawXML) => {
      const { parsedFeed, parsedPosts } = rawXMLparser(rawXML);
      const isNewFeed = state.feeds.every(({ title }) => title !== parsedFeed.title);
      if (isNewFeed) state.feeds.push(parsedFeed);

      const newPosts = parsedPosts.filter((parsedPost) => state.posts.every(
        (post) => parsedPost.title !== post.title,
      ));
      if (newPosts.length > 0) state.posts = [...newPosts, ...initialState.posts];
    })
    .then(() => setTimeout(() => { getFeed(initialState, state, url); }, 5000))
    .catch((err, timerID) => {
      clearTimeout(timerID);
      state.rssForm.errors = err;
    });
};

const createWatchedState = (initialState, elements, i18n) => {
  const state = onChange(initialState, (path, value) => {
    switch (path) {
      case 'channels':
        getFeed(initialState, state, value.at(-1));
        break;
      case 'posts':
        renderPostsCard(value, state, elements, i18n);
        break;
      case 'feeds':
        renderFeedsCard(value, elements, i18n);
        break;
      case 'rssForm.status':
        renderRssFormFeedback(value, elements, i18n);
        break;
      case 'rssForm.errors':
        renderRssFormError(value, elements, i18n);
        break;
      case 'ui.visitedLinks':
        renderVisitedLink(value.at(-1));
        break;
      default:
        throw new Error(`Unknown state path: ${path}`);
    }
  });
  return state;
};

const runApp = (initialState, elements, i18n) => {
  const state = createWatchedState(initialState, elements, i18n);
  const { form, input } = elements;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    validateURL(state, url)
      .then(() => {
        state.rssForm.status = 'processing';
        state.channels.push(url);
      })
      .catch((err) => {
        state.rssForm.status = 'invalid';
        state.rssForm.errors = err;
      });
    form.reset();
    input.focus();
  });
};

const initApp = () => {
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
          url: 'invalidUrlError',
        },
        mixed: {
          notOneOf: 'existUrlError',
        },
      });
      const initialState = {
        channels: [],
        feeds: [],
        posts: [],
        ui: {
          visitedLinks: [],
        },
        rssForm: {
          status: 'invalid',
          errors: [],
        },
      };
      const elements = {
        form: document.querySelector('form'),
        input: document.getElementById('url-input'),
        formSubmitButton: document.querySelector('.btn-primary'),
        feedback: document.querySelector('.feedback'),
        postsContainer: document.querySelector('.posts'),
        feedsContainer: document.querySelector('.feeds'),
        modalTitle: document.querySelector('.modal-title'),
        modalBody: document.querySelector('.modal-body'),
        modalMoreButton: document.querySelector('.full-article'),
        modalCloseButton: document.querySelector('.modal-footer > .btn-secondary'),
      };

      runApp(initialState, elements, i18n);
    })
    .catch((e) => console.error(e));
};

export default initApp;
