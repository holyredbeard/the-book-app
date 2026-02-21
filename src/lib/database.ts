import type { Conversation } from '@/types/conversation'
import { detectTeacher } from '@/types/conversation'

const DB_NAME = 'ChatArchiveDB'
const DB_VERSION = 3  // Increment version to add teacher field
const STORE_NAME = 'conversations'

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      // Delete old store if exists and recreate
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME)
      }
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      store.createIndex('title', 'title', { unique: false })
      store.createIndex('createTime', 'createTime', { unique: false })
    }
    
    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result
      resolve(dbInstance)
    }
  })
}

export async function saveConversations(conversations: Conversation[]): Promise<void> {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    // Clear existing data first
    store.clear()
    
    // Add all conversations
    for (const conv of conversations) {
      store.add({
        ...conv,
        createTime: conv.createTime.toISOString()
      })
    }
    
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function loadConversations(): Promise<Conversation[]> {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()
    
    request.onsuccess = () => {
      const data = request.result || []
      // Convert date strings back to Date objects and ensure teacher field exists
      const conversations = data.map((c: Conversation & { createTime: string }) => {
        const conv = {
          ...c,
          createTime: new Date(c.createTime)
        }
        // If teacher field is missing, detect it from content
        if (conv.teacher === undefined) {
          conv.teacher = detectTeacher(conv.title, conv.markdown.slice(0, 3000))
        }
        return conv
      })
      resolve(conversations)
    }
    
    request.onerror = () => reject(request.error)
  })
}

export async function clearDatabase(): Promise<void> {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getConversationCount(): Promise<number> {
  const db = await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.count()
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
