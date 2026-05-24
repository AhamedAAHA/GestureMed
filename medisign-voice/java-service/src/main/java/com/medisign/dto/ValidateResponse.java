package com.medisign.dto;

import java.util.List;

public class ValidateResponse {
    private boolean valid;
    private List<String> issues;

    public ValidateResponse() {}

    public ValidateResponse(boolean valid, List<String> issues) {
        this.valid = valid;
        this.issues = issues;
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }
    public List<String> getIssues() { return issues; }
    public void setIssues(List<String> issues) { this.issues = issues; }
}
