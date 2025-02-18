/* eslint-disable no-underscore-dangle */

import {
    SheetsRegistry
} from 'jss'
import {
    createGenerateClassName,
    createMuiTheme,
} from '@material-ui/core/styles'
import red from '@material-ui/core/colors/red'
import teal from '@material-ui/core/colors/teal'

// A theme with custom primary and secondary color.
// It's optional.
const theme = createMuiTheme({
    palette: {
        primary: {
            light: "#6d6d6d",
            main: "#424242",
            dark: "#1b1b1b",
            contrastText: '#ffffff',

        },
        secondary: {
            light: "#ff6659",
            main: "#d32f2f",
            dark: "#9a0007",
            contrastText: '#ffffff',
        },
    },
    typography: {
        useNextVariants: true,
    },
})

function createPageContext() {
    return {
        theme,
        // This is needed in order to deduplicate the injection of CSS in the page.
        sheetsManager: new Map(),
        // This is needed in order to inject the critical CSS.
        sheetsRegistry: new SheetsRegistry(),
        // The standard class name generator.
        generateClassName: createGenerateClassName(),
    }
}

export default function getPageContext() {
    // Make sure to create a new context for every server-side request so that data
    // isn't shared between connections (which would be bad).
    if (!process.browser) {
        return createPageContext()
    }

    // Reuse context on the client-side.
    if (!global.__INIT_MATERIAL_UI__) {
        global.__INIT_MATERIAL_UI__ = createPageContext()
    }

    return global.__INIT_MATERIAL_UI__
}