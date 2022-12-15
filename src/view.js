import onChange from 'on-change';

const renderViewedPost = (id, elements) => {
  const postElement = elements.postsContainer.querySelector(`[data-id="${id}"]`);
  postElement.classList.remove('fw-bold');
  postElement.classList.add('fw-normal', 'link-secondary');
};

const renderModal = (modalButtonID, state, elements, i18n) => {
  const post = state.posts.filter((postObj) => postObj.id === modalButtonID);
  const [{ title, description, link }] = post;
  const { modalTitle, modalBody, modalMoreButton } = elements;
  const { modalCloseButton } = elements;
  modalTitle.textContent = title;
  modalBody.textContent = description;
  modalMoreButton.setAttribute('href', link);
  modalMoreButton.textContent = i18n.t('ui.modal.readMore');
  modalCloseButton.textContent = i18n.t('ui.modal.close');
  renderViewedPost(modalButtonID, elements);
};

const createInnerContainerElements = (titleTranslation, i18n) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  cardTitle.innerHTML = i18n.t(titleTranslation);

  const listGroup = document.createElement('ul');
  listGroup.classList.add('list-group', 'border-0', 'rounded-0');
  cardBody.append(cardTitle);
  card.append(cardBody);
  return { card, listGroup };
};

const createModalButton = (id, state, elements, i18n) => {
  const button = document.createElement('button');
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  button.dataset.id = id;
  button.dataset.bsToggle = 'modal';
  button.dataset.bsTarget = '#modal';
  button.innerHTML = i18n.t('ui.card.watchMore');
  button.setAttribute('type', 'button');
  return button;
};

const renderPostsCard = (postsData, state, elements, i18n) => {
  const { postsContainer } = elements;
  const { card, listGroup } = createInnerContainerElements('ui.card.postsTitle', i18n);
  postsData.forEach((postData) => {
    const { title, link, id } = postData;
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    const a = document.createElement('a');
    a.classList.add(...state.ui.viewedPostsID.includes(id) ? ['fw-normal', 'link-secondary'] : ['fw-bold']);
    Object.assign(a, { href: link, target: '_blank', rel: 'noopener noreferrer' });
    a.dataset.id = id;
    a.textContent = title;
    const modalButton = createModalButton(id, state, elements, i18n);
    li.append(a, modalButton);
    listGroup.append(li);
  });
  card.append(listGroup);
  postsContainer.replaceChildren(card);
};

const renderFeedsCard = (feedsData, elements, i18n) => {
  const { feedsContainer } = elements;
  const { card, listGroup } = createInnerContainerElements('ui.card.feedsTitle', i18n);
  feedsData.forEach((feedData) => {
    const { title, description } = feedData;
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = title;
    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = description;
    li.append(h3, p);
    listGroup.append(li);
  });
  card.append(listGroup);
  feedsContainer.replaceChildren(card);
};

const renderClearForm = (elements) => {
  const { input, formSubmitButton, feedback } = elements;
  feedback.classList.remove('text-success');
  feedback.classList.remove('text-danger');
  feedback.innerHTML = '';
  input.classList.remove('is-invalid');
  input.removeAttribute('readonly');
  formSubmitButton.removeAttribute('disabled');
};

const renderRssFormError = (error, elements, i18n) => {
  renderClearForm(elements);
  const { input, feedback } = elements;
  input.classList.add('is-invalid');
  feedback.innerHTML = i18n.t(error.message);
  feedback.classList.add('text-danger');
};

const renderRssFormFeedback = (status, elements, i18n) => {
  renderClearForm(elements);
  const { input, formSubmitButton, feedback } = elements;
  const { form } = elements;
  switch (status) {
    case 'invalid':
      input.classList.add('is-invalid');
      break;
    case 'processing':
      input.setAttribute('readonly', 'true');
      formSubmitButton.setAttribute('disabled', 'disabled');
      break;
    case 'success':
      feedback.classList.add('text-success');
      feedback.textContent = i18n.t('ui.rssForm.network.successedLoad');
      form.reset();
      input.focus();
      break;
    default:
      throw new Error(`Unknown form render status: ${status}`);
  }
};

export default (initialState, elements, i18n) => {
  const state = onChange(initialState, (path, value) => {
    switch (path) {
      case 'posts':
        renderPostsCard(value, state, elements, i18n);
        break;
      case 'feeds':
        renderFeedsCard(value, elements, i18n);
        break;
      case 'rssForm.status':
        renderRssFormFeedback(value, elements, i18n);
        break;
      case 'rssForm.error':
        renderRssFormError(value, elements, i18n);
        break;
      case 'ui.viewedPostsID':
        renderViewedPost(value.at(-1), elements);
        break;
      case 'ui.modalButtonID':
        renderModal(value, state, elements, i18n);
        break;
      default:
        throw new Error(`Unknown state path: ${path}`);
    }
  });
  return state;
};
