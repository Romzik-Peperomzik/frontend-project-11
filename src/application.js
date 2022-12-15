import axios from 'axios';
import i18next from 'i18next';
import { uniqueId } from 'lodash';
import { string, setLocale } from 'yup';
import rawXMLparser from './parser.js';
import viewWatchedState from './view.js';
import resources from './locales/index.js';

const updatePeriod = 5000;

const validateURL = (state, url) => {
  const channels = state.feeds.map((feed) => feed.link);
  const schema = string().url().notOneOf(channels);
  return schema.validate(url);
};

const processParsedFeed = (data, url) => ({ ...data, id: uniqueId(), link: url });

const processParsedPosts = (data, feedID, state) => {
  const newPosts = data.map((item) => ({ ...item, id: uniqueId(), feedID }));
  return newPosts.filter((newPost) => state.posts.every(
    (statePost) => newPost.title !== statePost.title
      || (newPost.title === statePost.title && newPost.feedID !== statePost.feedID),
  ));
};

const getFeed = (url) => axios
  .get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
  .then((response) => response.data.contents);

const updatePosts = (state) => {
  const promises = state.feeds.map((feed) => getFeed(feed.link)
    .then((rawXML) => {
      const [, parsedPosts] = rawXMLparser(rawXML);
      const postsItem = processParsedPosts(parsedPosts, feed.id, state);
      if (postsItem.length > 0) state.posts = [...postsItem, ...state.posts];
    }));
  Promise.all(promises)
    .finally(() => setTimeout(() => { updatePosts(state); }, updatePeriod));
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
        feeds: [],
        posts: [],
        ui: {
          viewedPostsID: [],
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
      const state = viewWatchedState(initialState, elements, i18n);
      const { form, postsContainer } = elements;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        state.rssForm.status = 'processing';
        const formData = new FormData(e.target);
        const url = formData.get('url');
        validateURL(state, url)
          .then(() => getFeed(url))
          .then((rawXML) => {
            const [parsedFeed, parsedPosts] = rawXMLparser(rawXML);
            const feed = processParsedFeed(parsedFeed, url);
            state.feeds.push(feed);

            const newPosts = processParsedPosts(parsedPosts, feed.id, state);
            if (newPosts.length > 0) state.posts = [...newPosts, ...state.posts];
            state.rssForm.status = 'success';
          })
          .catch((err) => {
            state.rssForm.status = 'invalid';
            state.rssForm.error = err;
          });
      });

      postsContainer.addEventListener('click', (e) => {
        const { id } = e.target.dataset;
        if (id) {
          state.ui.modalButtonID = id;
          if (!state.ui.viewedPostsID.includes(id)) state.ui.viewedPostsID.push(id);
        }
      });

      setTimeout(() => { updatePosts(state); }, updatePeriod);
    });
};

export default app;
