(() => {
  try {
    const rawValue = localStorage.getItem("tijarahjo_dark_mode");
    const parsedValue = rawValue === null ? null : JSON.parse(rawValue);
    const isDark = parsedValue === true || parsedValue === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  } catch {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }
})();
