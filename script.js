const form = document.getElementById('hostForm');
const spaceSelect = document.getElementById('space-type');
const otherInput = document.getElementById('other-space');

const customAlert = document.getElementById('custom-alert');
const alertMessage = document.getElementById('custom-alert-message');
const alertClose = document.getElementById('custom-alert-close');

// Show/hide "Other" input
spaceSelect.addEventListener('change', () => {
  if (spaceSelect.value === 'Other') {
    otherInput.style.display = 'block';
  } else {
    otherInput.style.display = 'none';
  }
});

// Intercept submit to show custom alert
form.addEventListener('submit', (e) => {
  // Wait a tiny bit to let the iframe load
  setTimeout(() => {
    alertMessage.textContent = "Thank you for signing up! Your space has been submitted.";
    customAlert.style.display = 'block';
    form.reset();
    otherInput.style.display = 'none';
  }, 100);
});

// Close alert
alertClose.addEventListener('click', () => {
  customAlert.style.display = 'none';
});