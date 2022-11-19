import { string } from 'yup';
import view from './view.js';

const validateUrl = (state, url) => {
  const schema = string().url().notOneOf(state.channels);
  return schema.validate(url);
};

const runApp = (state, elements) => {
  const { form } = elements;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');

    validateUrl(state, url)
      .then(() => {
        state.rssForm.status = 'valid';
        state.channels.push(url);
      })
      .catch((err) => {
        state.rssForm.status = 'invalid';
        state.rssForm.errors = err;
      });
  });
};

const initApp = () => {
  const initialState = {
    channels: [],
    rssForm: {
      status: 'invalid',
      errors: [],
    },
  };
  const elements = {
    form: document.querySelector('form'),
    input: document.getElementById('url-input'),
  };
  const state = view(initialState, elements);

  runApp(state, elements);
};

export default initApp;
