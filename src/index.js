import './styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// console.log('here'); // eslint-disable-line no-console

const body = document.querySelector('body');
const form = document.createElement('form');
const textField = document.createElement('input');
const button = document.createElement('button');
const formContainer = document.createElement('div');

textField.setAttribute('type', 'text');
textField.setAttribute('placeholder', 'Ссылка RSS');

button.setAttribute('type', 'submit');
button.classList.add('btn', 'btn-primary');
button.textContent = 'Добавить';

form.append(textField);
form.append(button);

formContainer.classList.add('container', 'py-4', 'px-3', 'mx-auto');
formContainer.append(form);
body.append(formContainer);
