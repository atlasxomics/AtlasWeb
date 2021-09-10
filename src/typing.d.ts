declare module '*.md' {
  const value: string;
  export default value;
}

declare module 'vue-file-toolbar-menu';

// extend mousetrap properties
declare namespace Mousetrap {
  interface MousetrapStatic {
    paused: boolean;
    pause(): void;
    unpause(): void;
  }
}
