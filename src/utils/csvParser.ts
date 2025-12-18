export interface ParsedContact {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    status: 'active' | 'inactive' | 'do-not-call';
    do_not_call: boolean;
}

/**
 * A robust CSV parser for contact files.
 * Handles different delimiters, quotes, and various header names.
 */
export const parseContactCSV = (csvText: string): ParsedContact[] => {
    // Split by newline and handle both \n and \r\n, ignore empty lines
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    // Detect delimiter by counting occurrences in the header line
    const firstLine = lines[0];
    const delimiters = [',', ';', '\t', '|'];
    const delimiter = delimiters.reduce((prev, curr) => {
        return (firstLine.split(curr).length > firstLine.split(prev).length) ? curr : prev;
    }, ',');

    // Parse headers and clean them up
    const headers = firstLine.split(delimiter).map(h =>
        h.trim().toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '_')
    );

    const data: ParsedContact[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        // Proper CSV splitting that handles quotes and the detected delimiter
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                // Handle escaped quotes (nested quotes "")
                if (inQuotes && line[j + 1] === '"') {
                    current += '"';
                    j++; // skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        // Map columns to a temporary row object
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
            // Clean up value from surrounding quotes if any
            let val = values[index] || '';
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1);
            }
            row[header] = val;
        });

        // Helper to find a value by checking multiple possible header variations
        const getValue = (keys: string[]) => {
            for (const key of keys) {
                const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
                if (row[normalizedKey] !== undefined) return row[normalizedKey];

                // Try variations without underscores or spaces
                const collapsedKey = normalizedKey.replace(/_+/g, '');
                if (row[collapsedKey] !== undefined) return row[collapsedKey];

                // Try searching all keys for a partial match if literal match fails
                const partialMatch = Object.keys(row).find(k => k.includes(collapsedKey) || collapsedKey.includes(k));
                if (partialMatch) return row[partialMatch];
            }
            return '';
        };

        const contact: ParsedContact = {
            first_name: getValue(['first_name', 'firstname', 'first', 'fname', 'name', 'given_name', 'nickname']),
            last_name: getValue(['last_name', 'lastname', 'last', 'lname', 'surname', 'family_name']),
            phone: getValue(['phone', 'phone_number', 'phonenumber', 'telephone', 'mobile', 'tel', 'cell', 'contact_number']),
            email: getValue(['email', 'email_address', 'emailaddress', 'e-mail', 'mail']),
            status: (getValue(['status']) || 'active') as 'active' | 'inactive' | 'do-not-call',
            do_not_call: [true, 'true', '1', 'yes', 'y'].includes(getValue(['do_not_call', 'dnd', 'do_not_phone']))
        };

        // If first_name is empty but we have a 'name' field, it might be a full name
        // Also handle cases where 'name' was already mapped to first_name
        const rawName = getValue(['name', 'full_name', 'fullname']);
        if ((!contact.first_name || contact.first_name === rawName) && rawName) {
            const parts = rawName.split(/\s+/).filter(Boolean);
            if (parts.length > 0) {
                contact.first_name = parts[0];
                if (parts.length > 1 && !contact.last_name) {
                    contact.last_name = parts.slice(1).join(' ');
                }
            }
        }

        // Only add if we have at least a first name and some way to contact them
        if (contact.first_name && (contact.phone || contact.email)) {
            data.push(contact);
        }
    }

    return data;
};
