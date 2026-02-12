import toast from 'react-hot-toast';

export const toastSuccess = (message) => {
  toast.success(message);
};

export const toastError = (message) => {
  toast.error(message);
};

export const toastWarning = (message) => {
  toast(message, {
    icon: '⚠️',
  });
};

export const toastInfo = (message) => {
  toast(message);
};
