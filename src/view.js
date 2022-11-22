import onChange from 'on-change';

const renderRssFormError = (state, elements, i18n) => {
  const { errors } = state.rssForm;
  const { feedback } = elements;
  feedback.innerHTML = i18n.t(errors.message);
  feedback.classList.add('text-danger');
  feedback.classList.remove('text-success');
};

const renderRssForm = (state, elements) => {
  const { status } = state.rssForm;
  const { form, input, feedback } = elements;
  switch (status) {
    case 'invalid':
      input.classList.add('is-invalid');
      break;
    case 'valid':
      input.classList.remove('is-invalid');
      // Successfull url load
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      feedback.innerHTML = 'RSS успешно загружен'; // i18n.t(rssSuccessedLoad);
      // ^ TODO: переместить строки в блок при успешной загрузке rss
      form.reset();
      input.focus();
      break;
    default:
      throw new Error(`Unknown form render status: ${status}`);
  }
};

const render = (state, path, elements, i18n) => {
  switch (path) {
    case 'rssForm.status':
      renderRssForm(state, elements);
      break;
    case 'channels':
      break;
    case 'rssForm.errors':
      renderRssFormError(state, elements, i18n);
      break;
    default:
      throw new Error(`Unknown state path: ${path}`);
  }
};

const view = (state, elements, i18n) => onChange(state, (path) => {
  render(state, path, elements, i18n);
});

export default view;
