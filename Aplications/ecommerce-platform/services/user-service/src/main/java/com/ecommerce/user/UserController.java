package com.ecommerce.user;

import com.ecommerce.user.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtService  jwtService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status",  "UP",
            "service", "user-service",
            "version", System.getenv().getOrDefault("APP_VERSION", "1.0.0")
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                             .body(userService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        UserDTO user  = userService.authenticate(req);
        String  token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(token, user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    // Admin only — promote user to admin
    @PatchMapping("/{id}/promote")
    public ResponseEntity<UserDTO> promoteToAdmin(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {
        if (!"admin".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                 .body(null);
        }
        return ResponseEntity.ok(userService.promoteToAdmin(id));
    }
}
