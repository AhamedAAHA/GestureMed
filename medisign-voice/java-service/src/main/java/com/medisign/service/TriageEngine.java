package com.medisign.service;

import com.medisign.dto.TriageResponse;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
public class TriageEngine {

    private static final List<String> EMERGENCY_KEYWORDS = Arrays.asList(
            "can't breathe", "cannot breathe", "chest pain", "heart attack",
            "heavy bleeding", "unconscious", "stroke", "seizure", "choking",
            "anaphylaxis", "cardiac arrest"
    );

    private static final List<String> WARNING_KEYWORDS = Arrays.asList(
            "pain", "fever", "bleeding", "dizzy", "nausea", "vomiting",
            "help", "doctor", "weak", "swelling", "infection"
    );

    public TriageResponse score(String message, String urgencyHint) {
        String text = message == null ? "" : message.toLowerCase(Locale.ROOT);
        int score = 0;
        StringBuilder reason = new StringBuilder();

        for (String keyword : EMERGENCY_KEYWORDS) {
            if (text.contains(keyword)) {
                score += 35;
                reason.append("Emergency keyword: ").append(keyword).append("; ");
            }
        }

        for (String keyword : WARNING_KEYWORDS) {
            if (text.contains(keyword)) {
                score += 12;
                reason.append("Warning keyword: ").append(keyword).append("; ");
            }
        }

        if ("Emergency".equalsIgnoreCase(urgencyHint)) {
            score += 40;
            reason.append("AI hint: Emergency; ");
        } else if ("Warning".equalsIgnoreCase(urgencyHint)) {
            score += 20;
            reason.append("AI hint: Warning; ");
        }

        if (text.length() > 120) {
            score += 5;
        }

        score = Math.min(score, 100);

        String urgency;
        if (score >= 60) {
            urgency = "Emergency";
        } else if (score >= 25) {
            urgency = "Warning";
        } else {
            urgency = "Normal";
        }

        if (reason.length() == 0) {
            reason.append("No critical triage indicators found");
        }

        return new TriageResponse(score, urgency, reason.toString().trim());
    }
}
