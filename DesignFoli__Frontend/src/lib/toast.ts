import toast from "react-hot-toast";

// React Hot Toast utility functions
export const showToast = {
  success: (message: string, header?: string) => {
    toast.success(message, {
      duration: 4000,
      position: "top-right",
      style: {
        background: "#f0fdf4",
        color: "#166534",
        border: "1px solid #bbf7d0",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      iconTheme: {
        primary: "#16a34a",
        secondary: "#f0fdf4",
      },
    });
  },

  error: (message: string, header?: string) => {
    toast.error(message, {
      duration: 4000,
      position: "top-right",
      style: {
        background: "#fef2f2",
        color: "#991b1b",
        border: "1px solid #fecaca",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      iconTheme: {
        primary: "#dc2626",
        secondary: "#fef2f2",
      },
    });
  },

  info: (message: string, header?: string) => {
    toast(message, {
      duration: 4000,
      position: "top-right",
      style: {
        background: "#eff6ff",
        color: "#1e40af",
        border: "1px solid #dbeafe",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      icon: "ℹ️",
    });
  },

  warning: (message: string, header?: string) => {
    toast(message, {
      duration: 4000,
      position: "top-right",
      style: {
        background: "#fffbeb",
        color: "#92400e",
        border: "1px solid #fef3c7",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      icon: "⚠️",
    });
  }
};
