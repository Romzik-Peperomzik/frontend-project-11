import onChange from 'on-change';

const renderRssForm = (state, elements) => {
  const { form, input } = elements;
  if (state.rssForm.status === 'invalid') {
    input.classList.add('is-invalid');
  } else {
    input.classList.remove('is-invalid');
    form.reset();
    input.focus();
  }
};

const render = (state, path, elements) => {
  switch (path) {
    case 'rssForm.status':
    case 'rssForm.errors':
    case 'channels':
      renderRssForm(state, elements);
      break;
    default:
      throw new Error(`Unknown state path: ${path}`);
  }
};

const view = (state, elements) => onChange(state, (path) => {
  render(state, path, elements);
});

export default view;
