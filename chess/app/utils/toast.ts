import toast from 'react-hot-toast';

const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-center',
    });
  },
  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-center',
    });
  },
  info: (message: string) => {
    toast(message, {
      duration: 3000,
      position: 'top-center',
      icon: 'ℹ️',
    });
  },
  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-center',
    });
  },
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  }
};

export default showToast;
