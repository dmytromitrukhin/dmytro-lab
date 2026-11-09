import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
    base: '/dmytro-lab/',
    build: {
        rolldownOptions: {
            input: {
                main: fileURLToPath(new URL('./index.html', import.meta.url)),
                print: fileURLToPath(new URL('./print-prepress.html', import.meta.url)),
            },
        },
    },
});
