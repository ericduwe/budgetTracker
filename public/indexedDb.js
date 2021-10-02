let db;
let budgetVersion;

const request = indexedDB.open('budgetDB', 1);

request.onupgradeneeded = function (e) {
    const { oldVersion } = e;
    const newVersion = e.newVersion || db.version;

    db = e.target.result;
    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('unsavedTx', {autoIncrement: true});

    }
}

request.onerror = function (e) {
    console.log(`${e.target.errorCode}`)
}

function checkDatabase () {
    let transaction = db.transaction(['unsavedTx'], 'readwrite');
    const store = transaction.objectStore('unsavedTx')
    const getAll = store.getAll();
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
            })
            .then((response) => response.json())
            .then((res) => {
                if (res.length !== 0) {
                    transaction = db.transaction(['unsavedTx'], 'readwrite')
                    const currentStore = transaction.objectStore('unsavedTx')
                    currentStore.clear();
                }
            })
        }
    }
}

request.onsuccess = function (e) {
    db = e.target.result;

    if (navigator.onLine) {
        checkDatabase();

    }
}

const saveRecord = (record) => {
    const transaction = db.transaction(['unsavedTx'], 'readwrite');
    const store = transaction.objectStore('unsavedTx');
    store.add(record);
}