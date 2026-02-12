# Quick Installation Guide - Duplicate Image Detection

## Installation Steps

### 1. Install Required Dependency

```bash
cd backend
npm install sharp
```

**What is Sharp?**
- Fast image processing library for Node.js
- Used for generating perceptual hashes
- Native dependency (requires Python/build tools on Windows)

**Windows Users:** If installation fails:
```bash
npm install --global windows-build-tools
npm install sharp
```

### 2. Verify Installation

```bash
node -e "const sharp = require('sharp'); console.log('✅ Sharp installed successfully!');"
```

### 3. Run Migration (For Existing Artworks)

```bash
# Make sure your database is running
node backend/migrations/addImageHashes.js
```

**Expected Output:**
```
Connecting to MongoDB...
Connected successfully!

Found 15 artworks to process

[1/15] Processing: Silent Flight
  ✅ Hash: a1b2c3d4e5f6...
  ✅ pHash: 1f3a5b7c9d2e4f6a

...

Creating indexes...
✅ Created unique index on imageHash
✅ Created index on perceptualHash
✅ Created compound index on artist_id and created_at

=== MIGRATION SUMMARY ===
Total artworks processed: 15
✅ Successful: 15
❌ Errors: 0

✅ Migration completed!
```

### 4. Restart Backend Server

```bash
npm run dev
```

### 5. Test Duplicate Detection

**Upload Test:**
1. Upload an artwork image
2. Try uploading the same image again
3. Should see error: "This image has already been uploaded"

**Similar Image Test:**
1. Upload an artwork image
2. Make a small edit (add text, slight crop)
3. Try uploading edited version
4. Should see error: "A very similar image has already been uploaded"

## File Structure (After Installation)

```
backend/
├── models/
│   └── Artwork.js              ✅ Updated with hash fields
├── utils/
│   └── imageHash.js            ✅ New - Hash utilities
├── routes/
│   └── artworks.js             ✅ Updated upload controller
├── migrations/
│   └── addImageHashes.js       ✅ New - Migration script
├── package.json                ✅ Updated with sharp dependency
└── DUPLICATE_DETECTION.md      ✅ New - Documentation

src/
└── components/
    ├── ArtistArtworksTab.jsx   ✅ Updated error handling
    └── EditArtistProfile.jsx   ✅ Updated error handling
```

## Verification Checklist

- [ ] Sharp dependency installed (`npm list sharp`)
- [ ] Migration completed successfully
- [ ] Backend server running without errors
- [ ] Upload test passes (duplicate rejected)
- [ ] Frontend shows duplicate error message
- [ ] Database indexes created (`db.artworks.getIndexes()`)

## Troubleshooting

### Issue: Sharp installation fails
**Solution:**
```bash
# Windows
npm install --global windows-build-tools
npm install sharp

# Mac/Linux
npm install --build-from-source sharp
```

### Issue: Migration shows "File not found"
**Solution:** Normal - some old artworks may have deleted images. Migration skips these automatically.

### Issue: No duplicate detection working
**Solution:** 
1. Check migration ran successfully
2. Verify indexes: `db.artworks.getIndexes()` in MongoDB shell
3. Check console logs during upload

### Issue: Too many false positives
**Solution:** In `backend/routes/artworks.js`, change threshold:
```javascript
// Line ~85
areSimilarImages(perceptualHash, artwork.perceptualHash, 12) // Increase from 8 to 12
```

## MongoDB Index Verification

```javascript
// Connect to MongoDB shell
mongosh

// Use your database
use artgallery

// Check indexes
db.artworks.getIndexes()

// Should see:
// { v: 2, key: { imageHash: 1 }, name: 'imageHash_1', unique: true }
// { v: 2, key: { perceptualHash: 1 }, name: 'perceptualHash_1' }
```

## Performance Notes

- **SHA-256 hash**: ~10-50ms per image
- **Perceptual hash**: ~50-200ms per image
- **Database lookup**: ~1-5ms (with indexes)
- **Similar image check**: ~100-500ms (checks 1000 recent uploads)

## Next Steps

1. ✅ Test duplicate detection thoroughly
2. ✅ Monitor upload response times
3. ✅ Adjust similarity threshold if needed
4. ✅ Review documentation in `DUPLICATE_DETECTION.md`
5. ✅ Consider implementing admin dashboard for duplicates

## Support

For detailed documentation, see: `backend/DUPLICATE_DETECTION.md`

For issues:
1. Check backend console logs
2. Verify database indexes
3. Test hash generation manually
4. Review migration output

---

**Status**: ✅ Ready for Production  
**Version**: 1.0.0  
**Last Updated**: February 2026
