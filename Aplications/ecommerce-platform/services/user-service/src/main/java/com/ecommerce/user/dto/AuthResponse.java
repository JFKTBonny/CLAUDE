package com.ecommerce.user.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String  token;
    private UserDTO user;
}