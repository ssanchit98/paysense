package com.paysense.config;

import com.paysense.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final TransactionService transactionService;

    @Override
    public void run(ApplicationArguments args) {
        transactionService.seedDemoData();
    }
}
