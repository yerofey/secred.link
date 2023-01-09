class Storage {
  getItem(key) {
    const itemStr = localStorage.getItem(key);

    if (!itemStr) {
      return null;
    }

    const item = JSON.parse(itemStr);
    const now = new Date();

    if (now.getTime() > item.expire) {
      this.removeItem(key);
      return null;
    }

    return item.value;
  }

  setItem(key, value, ttl) {
    const now = new Date();
    const item = {
      value: value,
      expire: now.getTime() + ttl,
    };
    return localStorage.setItem(key, JSON.stringify(item));
  }

  removeItem(key) {
    return localStorage.removeItem(key);
  }

  hasKey(key) {
    return (this.getItem(key) !== null);
  }

  getAllKeys(prefix = '') {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if ((prefix === '' || key.includes(prefix)) && this.getItem(key) !== null) {
        keys.push(key);
      }
    }
    return keys;
  }

  getAllItems(prefix = '') {
    const items = {};
    for (let key of this.getAllKeys(prefix)) {
      const item = this.getItem(key);
      if (item !== null) {
        items[key] = item;
      }
    }
    return items;
  }

  removeAllItems(prefix = '') {
    for (let key of this.getAllKeys(prefix)) {
      this.removeItem(key);
    }
  }
}

export default Storage;
