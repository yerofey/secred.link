<!-- eslint-disable max-len -->
<template>
  <div class="layout">
    <header class="app-header p-3 border-bottom">
      <div class="container-sm">
        <div class="app-nav d-flex flex-wrap">
          <div class="app-main d-flex align-items-center justify-center">
            <router-link
              to="/"
              class="d-inline-flex align-items-center text-decoration-none logo-link"
            >
              <img
                src="/img/icons/favicon-32x32.png"
                alt=""
                width="32"
                height="32"
                class="logo-img d-inline-block align-text-top"
                draggable="false"
              />
              <span class="app-title">Secred</span>
              <span class="app-subtitle">β</span>
            </router-link>
            <button @click="colorMode = (colorMode === 'dark' ? 'light' : 'dark')" class="btn btn-sm button d-inline-block app-theme-button">
              <BIconMoonFill v-if="colorMode === 'light'"/>
              <BIconSunFill v-else/>
            </button>
          </div>
          <div class="app-buttons">
            <router-link
              to="/storage"
              class="button btn d-inline-block"
            >
              <BIconBookmarkStarFill/>
            </router-link>
          </div>
        </div>
      </div>
    </header>
    <main class="app-content">
      <div class="container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
import {
  BIconBookmarkStarFill,
  BIconMoonFill,
  BIconSunFill,
} from 'bootstrap-icons-vue';
import { useDark, useColorMode } from '@vueuse/core';

export default {
  components: {
    BIconBookmarkStarFill,
    BIconMoonFill,
    BIconSunFill,
  },
  setup() {
    const colorMode = useColorMode();
    useDark({
      selector: 'html',
      attribute: 'data-bs-theme',
      valueDark: 'dark',
      valueLight: 'light'
    });

    return {
      colorMode,
    }
  },
};
</script>

<style lang="scss">
@import "../node_modules/bootstrap/scss/bootstrap";

html,
#app {
  height: 100%;
}

html {
  &[data-bs-theme="dark"] {
    --app-primary-bg: #212529;
    --app-secondary-bg: #343a40;
    --app-icon-color: #ccc;

    color-scheme: dark;
  }

  &[data-bs-theme="light"] {
    --app-primary-bg: #f9fafb;
    --app-secondary-bg: #fff;
    --app-icon-color: #222;

    color-scheme: light;
  }
}

body {
  position: relative;

  height: auto;
  min-height: 100vh;

  background-color: var(--app-primary-bg);
}

#app {
  color: var(--bs-body-color);
  font-family: 'Poppins', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

footer {
  font-size: 14px;
}

header {
  text-align: left;

  background-color: var(--app-secondary-bg);


  .app-nav {
    position: relative;

    display: flex;
    justify-content: space-between;


    > .app-main {
      display: flex;


      > .logo-link {
        user-select: none;


        > .app-title {
          margin-left: 7px;

          color: var(--bs-body-color);
          font-size: 22px;
          font-weight: 700;
        }

        > .app-subtitle {
          vertical-align: text-top;

          margin-top: -8px;
          margin-left: 4px;

          color: var(--bs-secondary-color);
          font-size: 14px;
        }
      }

      > .app-theme-button {
        margin-left: 10px;
      }
    }

    // > .app-main > .btn,
    // > .app-buttons > .btn {
    //   background-color: var(--bs-tertiary-bg);
    //   border: 1px solid var(--bs-border-color);

    //   color: var(--app-icon-color);
    // }

    > .app-buttons {
      display: flex;
    }
  }
}

.button {
  background-color: var(--bs-tertiary-bg) !important;
  border: 1px solid var(--bs-border-color) !important;

  color: var(--app-icon-color);
}

.link {
  text-decoration: none;
}

main {
  padding: 40px 0;
  min-height: 100%;

  text-align: center;


  .form-container {
    margin: 0 auto;

    width: 480px;
    @media screen and (max-width: 480px) {
      width: 100%;
    }
    padding: 0 10px;


    h5 {
      color: var(--bs-emphasis-color); //#262728;
    }

    h6 {
      color: var(--bs-tertiary-color); // #787878;
    }

    .input-check {
      display: flex;
      align-items: center;

      > .form-check-input {
        margin-top: 0 !important;
      }
    }

    .input-group-text {
      width: 101px;
    }
  }
}

.span-after-icon {
  margin-left: 5px;
  vertical-align: middle;
}

// svg {
//   color: var(--app-svg-fill-color) !important;


//   > path {
//     color: var(--app-svg-fill-color) !important;
//     fill: var(--app-svg-fill-color) !important;
//   }
// }
</style>
