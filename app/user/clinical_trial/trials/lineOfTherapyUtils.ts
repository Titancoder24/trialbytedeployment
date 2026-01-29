const formatLineOfTherapy = (text: string | null | undefined): string => {
    if (!text) return "N/A";
    const normalized = text.toLowerCase().trim().replace(/\s+/g, '_');

    const mappings: { [key: string]: string } = {
        "second_line": "2 - Second Line",
        "first_line": "1 - First Line",
        "at_least_second_line": "2+ - At least second line",
        "at_least_third_line": "3+ - At least third line",
        "at_least_first_line": "1+ - At least first line",
        "third_line": "3 - Third Line",
        "fourth_line": "4 - Fourth Line"
    };

    return mappings[normalized] || formatTextValue(text);
};
