/// <reference types="vite/client" />

declare module 'xlsx' {
  export const utils: {
    aoa_to_sheet: (data: any[][]) => any;
    book_new: () => any;
    book_append_sheet: (workbook: any, worksheet: any, name: string) => void;
  };
  export function writeFile(workbook: any, filename: string): void;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}
