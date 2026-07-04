tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "sans-serif"],
      },
      colors: {
        indigo: {
          50: "#eef2ff",
          100: "#e0e7ff",
          600: "#3f51b5" ,
          700: "#303f9f",
        },
      },
      boxShadow: {
        mui: "0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)",
      },
    },
  },
};
