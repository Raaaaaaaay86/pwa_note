const dbPromise = idb.open('posts-store', 1, (db) => {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', { keyPath: 'id' });
  }
});

const writeData = (st, data) => {
  return dbPromise
    .then((db) => {
      const tx = db.transaction(st, 'readwrite');
      const store = tx.objectStore(st);
      store.put(data);
      return tx.complete;
    })
}

const readAllData = (st) => {
  return dbPromise
    .then((db) => {
      const tx = db.transaction(st, 'readonly');
      const store = tx.objectStore(st);
      return store.getAll();
    })
}

const clearAllData = (st) => {
  return dbPromise
    .then((db) => {
      const tx = db.transaction(st, 'readwrite');
      const store = tx.objectStore(st);
      store.clear();
      return tx.complete;
    })
}

const deleteItemFromData = (st, id) => { // 刪除 indexedDB 單一筆資料
  return dbPromise
    .then((db) => {
      const tx = db.transaction(st, 'readwrite');
      const store = tx.objectStore(st);
      store.delete(id);
      return tx.complete;
    })
    .then(() => {
      console.log('Item deleted!');
    });
}