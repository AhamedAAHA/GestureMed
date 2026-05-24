package com.medisign.service;

import com.medisign.dto.ValidateResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class MessageValidator {

    private static final Pattern SAFE_PATTERN = Pattern.compile("^[\\p{L}\\p{N}\\s.,!?'\\-–—/()]+$");

    public ValidateResponse validate(String message) {
        List<String> issues = new ArrayList<>();

        if (message == null || message.trim().isEmpty()) {
            issues.add("Message cannot be empty");
            return new ValidateResponse(false, issues);
        }

        String trimmed = message.trim();

        if (trimmed.length() < 2) {
            issues.add("Message is too short");
        }

        if (trimmed.length() > 2000) {
            issues.add("Message exceeds maximum length of 2000 characters");
        }

        if (!SAFE_PATTERN.matcher(trimmed).matches()) {
            issues.add("Message contains unsupported characters");
        }

        if (trimmed.matches("(?i).*\\b(script|drop table|delete from)\\b.*")) {
            issues.add("Message contains prohibited content");
        }

        return new ValidateResponse(issues.isEmpty(), issues);
    }
}
