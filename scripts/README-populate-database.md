# Database Population Script

## Usage

To populate the PostgreSQL database with sanitized drug data:

1. **Start the PostgreSQL database:**
   ```bash
   docker compose up -d postgres
   ```

2. **Wait for the database to be ready:**
   ```bash
   docker compose logs postgres
   ```
   Look for "database system is ready to accept connections"

3. **Run the population script:**
   ```bash
   npx tsx scripts/populate-database.ts
   ```

## What the script does:

- Connects to the PostgreSQL database using TypeORM
- Clears any existing drug data
- Reads all JSON files from `data/sanitized/`
- Inserts each drug record into the database
- Handles data mapping between JSON structure and Drug entity
- Provides progress updates during insertion

## Environment Variables:

The script uses these environment variables (with defaults):
- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 5432)
- `DB_USER` (default: prescriberpoint)
- `DB_PASSWORD` (default: password)
- `DB_NAME` (default: prescriberpoint)

## Expected Results:

- Should process 8 chunk files from `data/sanitized/`
- Will insert all drug records with sanitized content
- Progress will be shown every 10 records
- Final count will be displayed

## Troubleshooting:

- Ensure PostgreSQL is running and accessible
- Check that sanitized data files exist in `data/sanitized/`
- Verify environment variables match your database configuration