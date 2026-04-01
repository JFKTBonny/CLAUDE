package com.ecommerce.user.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long   id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
}
