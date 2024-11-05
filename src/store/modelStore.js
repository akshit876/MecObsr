import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useModelStore = create(
  persist(
    (set) => ({
      selectedModel: null,
      modelFields: null,
      setSelectedModel: (model) => set({ 
        selectedModel: model.id,
        modelFields: model.fields 
      }),
      clearModel: () => set({ 
        selectedModel: null,
        modelFields: null 
      }),
    }),
    {
      name: 'model-storage', // unique name for localStorage
    }
  )
)

export default useModelStore 