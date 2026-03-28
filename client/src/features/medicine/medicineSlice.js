import { createSlice } from '@reduxjs/toolkit';

const medicineSlice = createSlice({
  name: 'medicine',
  initialState: {
    searchQuery: '',
    searchResults: [],
    selectedMedicine: null,
    radius: 5,             // default radius in km
    userLocation: null,    // { lat, lng }
    loading: false,
    error: null,
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setSelectedMedicine: (state, action) => {
      state.selectedMedicine = action.payload;
    },
    setRadius: (state, action) => {
      state.radius = action.payload;
    },
    setUserLocation: (state, action) => {
      state.userLocation = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
  },
});

export const {
  setSearchQuery, setSearchResults, setSelectedMedicine,
  setRadius, setUserLocation, setLoading, setError, clearResults,
} = medicineSlice.actions;

export default medicineSlice.reducer;