import { toast } from 'sonner';

export function useToastNotifications() {
  const showSuccess = (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  };

  const showError = (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
    });
  };

  const showInfo = (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  };

  const showWarning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
    });
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const dismissToast = (toastId: string | number) => {
    toast.dismiss(toastId);
  };

  const showPromise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismissToast,
    showPromise,
  };
}

// Standalone functions for use outside React components
export const toastSuccess = (message: string, description?: string) => {
  toast.success(message, { description, duration: 4000 });
};

export const toastError = (message: string, description?: string) => {
  toast.error(message, { description, duration: 6000 });
};

export const toastInfo = (message: string, description?: string) => {
  toast.info(message, { description, duration: 4000 });
};

export const toastWarning = (message: string, description?: string) => {
  toast.warning(message, { description, duration: 5000 });
};
