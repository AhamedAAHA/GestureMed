package com.medisign.controller;

import com.medisign.dto.TriageRequest;
import com.medisign.dto.TriageResponse;
import com.medisign.dto.ValidateRequest;
import com.medisign.dto.ValidateResponse;
import com.medisign.service.MessageValidator;
import com.medisign.service.TriageEngine;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/java")
public class TriageController {

    private final TriageEngine triageEngine;
    private final MessageValidator messageValidator;

    public TriageController(TriageEngine triageEngine, MessageValidator messageValidator) {
        this.triageEngine = triageEngine;
        this.messageValidator = messageValidator;
    }

    @GetMapping("/health")
    public String health() {
        return "MediSign Java Service OK";
    }

    @PostMapping("/triage-score")
    public TriageResponse triageScore(@RequestBody TriageRequest request) {
        return triageEngine.score(request.getMessage(), request.getUrgencyHint());
    }

    @PostMapping("/validate-message")
    public ValidateResponse validateMessage(@RequestBody ValidateRequest request) {
        return messageValidator.validate(request.getMessage());
    }
}
