using DevProfile.API.Services;

namespace DevProfile.API.Tests;

/// <summary>
/// O calendário é lido do HTML público do perfil. Como não é um contrato de API,
/// o parser precisa falhar de forma mansa: sem dia nenhum, e nunca com exceção.
/// </summary>
public class ContributionCalendarTests
{
    private const string HtmlExemplo = """
        <table class="ContributionCalendar-grid">
          <tr>
            <td class="ContributionCalendar-day" data-date="2026-01-01" data-level="0"></td>
            <td class="ContributionCalendar-day" data-date="2026-01-02" data-level="3"></td>
            <td class="ContributionCalendar-day" id="x" data-ix="4" data-date="2026-01-03" data-level="4"></td>
            <td class="ContributionCalendar-day" data-date="2026-01-04" data-level="1"></td>
          </tr>
        </table>
        """;

    [Fact]
    public void Extrai_dia_e_intensidade_em_ordem_cronologica()
    {
        var calendario = ContributionCalendarService.Parse("dev", HtmlExemplo);

        Assert.Equal(4, calendario.Days.Count);
        Assert.Equal(new DateOnly(2026, 1, 1), calendario.Days[0].Date);
        Assert.Equal(3, calendario.Days[1].Level);
        Assert.Equal(4, calendario.Days[2].Level);
        Assert.Equal("dev", calendario.Username);
    }

    [Fact]
    public void Conta_apenas_os_dias_com_atividade()
    {
        var calendario = ContributionCalendarService.Parse("dev", HtmlExemplo);

        Assert.Equal(3, calendario.ActiveDays);
    }

    [Theory]
    [InlineData("")]
    [InlineData("<html><body>página de erro</body></html>")]
    [InlineData("<td data-date=\"nao-e-data\" data-level=\"2\"></td>")]
    public void Html_inesperado_devolve_calendario_vazio_sem_explodir(string html)
    {
        var calendario = ContributionCalendarService.Parse("dev", html);

        Assert.Empty(calendario.Days);
        Assert.Equal(0, calendario.ActiveDays);
    }

    [Fact]
    public void Intensidade_fora_da_escala_e_limitada_ao_teto()
    {
        var calendario = ContributionCalendarService.Parse("dev", "<td data-date=\"2026-02-02\" data-level=\"9\"></td>");

        Assert.Equal(4, calendario.Days.Single().Level);
    }
}
