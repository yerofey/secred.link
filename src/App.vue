<!-- eslint-disable max-len -->
<template>
  <header class="p-3 border-bottom">
    <div class="container-sm">
      <div class="app-nav d-flex flex-wrap">
        <router-link to="/" class="d-flex align-items-center text-dark text-decoration-none logo-link">
          <img src="/img/icons/apple-touch-icon.png" alt="" width="40" height="40" class="d-inline-block align-text-top" draggable="false">
          <span class="project-title">Secred</span>
          <span class="project-subtitle">β</span>
        </router-link>
        <!-- <div class="app-buttons">
          <router-link to="/storage" class="storage-link btn d-block link-dark text-decoration-none">
            <BIconGridFill/>
          </router-link>
        </div> -->
      </div>
    </div>
  </header>
  <main>
    <div class="container">
      <router-view/>
    </div>
  </main>
</template>

<script>
// import {
//   BIconGridFill, // Grid | Bookmark
// } from 'bootstrap-icons-vue';

export default {
  components: {
    // BIconGridFill,
    // BIconBookmarkStar,
  },
};
</script>

<style lang="scss">
html,
body,
#app {
  height: 100%;
}

#app {
  // font-family: Avenir, Helvetica, Arial, sans-serif;
  font-family: 'Poppins', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;

  background-color: #f9fafb;
}

footer {
  font-size: 14px;
}

header {
  text-align: left;

  background-color: #fff;

  .logo-link {
    user-select: none;
  }

  .project-title {
    margin-left: 7px;

    font-size: 22px;
    font-weight: 700;
  }

  .project-subtitle {
    vertical-align: text-top;

    margin-top: -8px;
    margin-left: 4px;

    color: #9a9a9a;
    font-size: 14px;
  }

  .app-nav {
    position: relative;
    align-self: flex-start;

    .app-buttons {
      // margin-top: -8px;
      // margin-left: 20px;
      position: absolute;
      top: 0;
      right: 0;

      .storage-link {
        &:hover {
          background-color: #f1f2ff;
        }
      }
    }
  }
}

.link {
  text-decoration: none;
}

main {
  padding-top: 40px;
  // height: 100%;
  // min-height: calc(100% - 130px);
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

.form-container {
  margin: 0 auto;

  width: 480px;
  @media screen and (max-width: 480px) {
    width: 100%;
  }
  padding: 0 10px;

  // background-color: #f5f6fa;
  // border: 1px solid rgb(216, 216, 221);
  // border-radius: 10px;

  h5 {
    color: #262728;
  }

  h6 {
    color: #787878;
  }

  .input-group-text {
    width: 101px;
  }

  // .submit-button {
  //   &.is-loading {

  //   }
  // }
}

.span-after-icon {
  margin-left: 3px;
  vertical-align: middle;
}
</style>
