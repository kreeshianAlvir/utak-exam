import app from "../firebaseConfig";
import { getDatabase, ref, set, push, get, remove } from "firebase/database";

import { getApp } from "firebase/app";
import { getStorage, uploadBytes } from "firebase/storage";
import { ref as storageRef } from "firebase/storage";

const db = getDatabase(app);

// GET
export async function get_category_list(category) {
  const table = ref(db, category);
  const list = await get(table);

  if (list.exists()) {
    const data = list.val();
    const arr = [];
    const keys = Object.keys(data);

    keys.forEach((item) => {
      const row = data[item];
      row.id = item;
      arr.push(row);
    });

    return arr;
  } else {
    return [];
  }
}

// POST
export async function add_item_category(category, obj) {
  const table = push(ref(db, category));
  const res = await set(table, obj)
    .then(() => {
      return "saved";
    })
    .catch(() => {
      return "error";
    });

  return res;
}

// PATCH
export async function edit_item_category(category, obj) {
  const id = obj.id;
  const table = ref(db, `${category}/${id}`);
  delete obj.id;
  const res = await set(table, obj)
    .then(() => {
      return "saved";
    })
    .catch(() => {
      return "error";
    });

  return res;
}

// DELETE
export async function delete_item_category(category, id) {
  const table = ref(db, `${category}/${id}`);
  const res = await remove(table)
    .then(() => {
      return "removed";
    })
    .catch(() => {
      return "error";
    });

  return res;
}
