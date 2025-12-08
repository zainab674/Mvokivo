# PowerShell script to combine all SQL migrations into a single file
# This creates COMPLETE_SCHEMA.sql with all migrations in the correct order

Write-Host "🔧 Combining all SQL migrations..." -ForegroundColor Cyan

# Output file
$outputFile = "COMPLETE_SCHEMA.sql"

# Get all migration files sorted by name (which includes timestamp)
$migrationFiles = Get-ChildItem -Path "supabase\migrations" -Filter "*.sql" | Sort-Object Name

# Create header for the combined file
$header = @'
-- ============================================================================
-- COMPLETE DATABASE SCHEMA FOR VOKIVO
-- ============================================================================
-- This file combines all migrations in chronological order
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create helper function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATIONS START HERE
-- ============================================================================

'@

# Write header to file
Set-Content -Path $outputFile -Value $header

# Counter for progress
$counter = 0
$total = $migrationFiles.Count

# Process each migration file
foreach ($file in $migrationFiles) {
    $counter++
    $percentage = [math]::Round(($counter / $total) * 100)
    
    Write-Host "[$counter/$total] Processing: $($file.Name)" -ForegroundColor Yellow
    Write-Progress -Activity "Combining Migrations" -Status "$percentage% Complete" -PercentComplete $percentage
    
    # Add migration separator
    $separator = @"

-- ============================================================================
-- MIGRATION: $($file.Name)
-- ============================================================================

"@
    
    Add-Content -Path $outputFile -Value $separator
    
    # Read and add migration content
    $content = Get-Content -Path $file.FullName -Raw
    Add-Content -Path $outputFile -Value $content
    
    # Add spacing
    Add-Content -Path $outputFile -Value "`n`n"
}

# Add footer
$footer = @"

-- ============================================================================
-- MIGRATIONS COMPLETE
-- ============================================================================
-- Total migrations applied: $total
-- Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- ============================================================================

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

"@

Add-Content -Path $outputFile -Value $footer

Write-Progress -Activity "Combining Migrations" -Completed
Write-Host "✅ Successfully created $outputFile" -ForegroundColor Green
Write-Host "📊 Total migrations combined: $total" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open Supabase Dashboard → SQL Editor" -ForegroundColor White
Write-Host "2. Copy content from $outputFile" -ForegroundColor White
Write-Host "3. Paste and run in SQL Editor" -ForegroundColor White
Write-Host ""
Write-Host "Or use Supabase CLI:" -ForegroundColor Yellow
Write-Host "   supabase db push" -ForegroundColor White
